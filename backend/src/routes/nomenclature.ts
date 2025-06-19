import express from 'express';
import { Request, Response } from 'express';
import { Connection, RowDataPacket } from 'mysql2/promise';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

interface DayRange {
  startDayOfYear: number;
  endDayOfYear: number;
  markupPercentage?: number;
  tolerancePercentage?: number;
}

interface CountrySeasonality {
  template_id: number | null;
  periods: DayRange[];
}

interface CountryData {
  country_id: number;
  brand_id: number;
  sku_code: string;
  type: 'regular' | 'exclusive';
  is_new_until: string | null;
  seasonality: CountrySeasonality;
}

interface NomenclatureRequest {
  name: string;
  countries: CountryData[];
}

const router = express.Router();

// Получить все товары
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const [items] = await pool.query(`
      SELECT 
        n.*,
        COALESCE(
          JSON_ARRAYAGG(
            IF(nc.id IS NOT NULL,
              JSON_OBJECT(
                'id', nc.id,
                'country_id', nc.country_id,
                'country_name', c.name,
                'brand_id', nc.brand_id,
                'brand_name', b.name,
                'sku_code', nc.sku_code,
                'type', nc.type,
                'is_new_until', DATE_FORMAT(nc.is_new_until, '%Y-%m-%d %H:%i:%s'),
                'seasonality', JSON_OBJECT(
                  'template_id', nc.seasonality_template_id,
                  'periods', COALESCE(
                    (
                      SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                          'startDayOfYear', ns2.start_day_of_year,
                          'endDayOfYear', ns2.end_day_of_year,
                          'markupPercentage', ns2.markup_percentage,
                          'tolerancePercentage', ns2.tolerance_percentage
                        )
                      )
                      FROM nomenclature_seasonality ns2
                      WHERE ns2.nomenclature_country_id = nc.id
                    ),
                    JSON_ARRAY()
                  )
                )
              ),
              NULL
            )
          ),
          JSON_ARRAY()
        ) as countries
      FROM nomenclature n
      LEFT JOIN nomenclature_country nc ON n.id = nc.nomenclature_id
      LEFT JOIN countries c ON nc.country_id = c.id
      LEFT JOIN brands b ON nc.brand_id = b.id
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `) as any[];

    const formattedItems = items.map((item: any) => ({
      ...item,
      countries: typeof item.countries === 'string' ? JSON.parse(item.countries) : item.countries
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error('Error fetching nomenclature:', error);
    res.status(500).json({ message: 'Ошибка при получении номенклатуры' });
  }
});

// Добавить новый товар
router.post('/', authenticateToken, async (req: Request<any, any, NomenclatureRequest>, res: Response) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { name, countries } = req.body;
    
    // Добавляем товар
    const [result] = await connection.query(
      'INSERT INTO nomenclature (name) VALUES (?)',
      [name]
    ) as any[];
    
    const nomenclatureId = result.insertId;
    
    // Добавляем страны
    for (const country of countries) {
      const [countryResult] = await connection.query(
        'INSERT INTO nomenclature_country (nomenclature_id, country_id, brand_id, sku_code, type, is_new_until, seasonality_template_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          nomenclatureId,
          country.country_id,
          country.brand_id,
          country.sku_code,
          country.type,
          country.is_new_until,
          country.seasonality.template_id
        ]
      ) as any[];
      
      const countryLinkId = countryResult.insertId;
      const { seasonality } = country;
      
      if (seasonality && seasonality.periods && seasonality.periods.length > 0) {
        // Вставляем все периоды сезонности
        const periodValues = seasonality.periods.map((period: DayRange) => [
          countryLinkId,
          period.startDayOfYear,
          period.endDayOfYear,
          period.markupPercentage || null,
          period.tolerancePercentage || null
        ]).flat();

        const placeholders = seasonality.periods.map(() => '(?, ?, ?, ?, ?)').join(', ');
        
        await connection.query(
          `INSERT INTO nomenclature_seasonality (nomenclature_country_id, start_day_of_year, end_day_of_year, markup_percentage, tolerance_percentage) VALUES ${placeholders}`,
          periodValues
        );
      }
    }
    
    await connection.commit();

    // Получаем полные данные созданного товара
    const [newItem] = await connection.query(`
      SELECT 
        n.*,
        COALESCE(
          JSON_ARRAYAGG(
            IF(nc.id IS NOT NULL,
              JSON_OBJECT(
                'id', nc.id,
                'country_id', nc.country_id,
                'country_name', c.name,
                'brand_id', nc.brand_id,
                'brand_name', b.name,
                'sku_code', nc.sku_code,
                'type', nc.type,
                'is_new_until', DATE_FORMAT(nc.is_new_until, '%Y-%m-%d %H:%i:%s'),
                'seasonality', JSON_OBJECT(
                  'template_id', nc.seasonality_template_id,
                  'periods', COALESCE(
                    (
                      SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                          'startDayOfYear', ns2.start_day_of_year,
                          'endDayOfYear', ns2.end_day_of_year,
                          'markupPercentage', ns2.markup_percentage,
                          'tolerancePercentage', ns2.tolerance_percentage
                        )
                      )
                      FROM nomenclature_seasonality ns2
                      WHERE ns2.nomenclature_country_id = nc.id
                    ),
                    JSON_ARRAY()
                  )
                )
              ),
              NULL
            )
          ),
          JSON_ARRAY()
        ) as countries
      FROM nomenclature n
      LEFT JOIN nomenclature_country nc ON n.id = nc.nomenclature_id
      LEFT JOIN countries c ON nc.country_id = c.id
      LEFT JOIN brands b ON nc.brand_id = b.id
      WHERE n.id = ?
      GROUP BY n.id
    `, [nomenclatureId]) as any[];

    const formattedItem = {
      ...newItem[0],
      countries: typeof newItem[0].countries === 'string' ? JSON.parse(newItem[0].countries) : newItem[0].countries
    };

    res.status(201).json(formattedItem);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating nomenclature:', error);
    res.status(500).json({ message: 'Ошибка при создании номенклатуры' });
  } finally {
    connection.release();
  }
});

// Обновить товар
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const { id } = req.params;
    const { name, countries } = req.body;

    // Обновляем товар
      await connection.query(
        'UPDATE nomenclature SET name = ? WHERE id = ?',
        [name, id]
      );

    // Удаляем старые связи со странами
      await connection.query(
        'DELETE FROM nomenclature_country WHERE nomenclature_id = ?',
        [id]
      );

    // Добавляем новые страны
      for (const country of countries) {
        const [countryResult] = await connection.query(
        'INSERT INTO nomenclature_country (nomenclature_id, country_id, brand_id, sku_code, type, is_new_until, seasonality_template_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          country.country_id,
          country.brand_id,
          country.sku_code,
          country.type,
          country.is_new_until,
          country.seasonality.template_id
        ]
        ) as any[];

      const countryLinkId = countryResult.insertId;
      const { seasonality } = country;

      if (seasonality && seasonality.periods && seasonality.periods.length > 0) {
        // Вставляем все периоды сезонности
        const periodValues = seasonality.periods.map((period: DayRange) => [
          countryLinkId,
          period.startDayOfYear,
          period.endDayOfYear,
          period.markupPercentage || null,
          period.tolerancePercentage || null
        ]).flat();

        const placeholders = seasonality.periods.map(() => '(?, ?, ?, ?, ?)').join(', ');
        
          await connection.query(
          `INSERT INTO nomenclature_seasonality (nomenclature_country_id, start_day_of_year, end_day_of_year, markup_percentage, tolerance_percentage) VALUES ${placeholders}`,
          periodValues
          );
        }
      }

      await connection.commit();

    // Получаем обновленные данные товара
      const [updatedItem] = await connection.query(`
        SELECT 
          n.*,
          COALESCE(
            JSON_ARRAYAGG(
            IF(nc.id IS NOT NULL,
                  JSON_OBJECT(
                    'id', nc.id,
                    'country_id', nc.country_id,
                    'country_name', c.name,
                    'brand_id', nc.brand_id,
                    'brand_name', b.name,
                    'sku_code', nc.sku_code,
                    'type', nc.type,
                    'is_new_until', DATE_FORMAT(nc.is_new_until, '%Y-%m-%d %H:%i:%s'),
                    'seasonality', JSON_OBJECT(
                  'template_id', nc.seasonality_template_id,
                  'periods', COALESCE(
                    (
                      SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                          'startDayOfYear', ns2.start_day_of_year,
                          'endDayOfYear', ns2.end_day_of_year,
                          'markupPercentage', ns2.markup_percentage,
                          'tolerancePercentage', ns2.tolerance_percentage
                        )
                      )
                      FROM nomenclature_seasonality ns2
                      WHERE ns2.nomenclature_country_id = nc.id
                    ),
                    JSON_ARRAY()
                  )
                )
              ),
              NULL
            )
            ),
          JSON_ARRAY()
          ) as countries
        FROM nomenclature n
        LEFT JOIN nomenclature_country nc ON n.id = nc.nomenclature_id
        LEFT JOIN countries c ON nc.country_id = c.id
        LEFT JOIN brands b ON nc.brand_id = b.id
        WHERE n.id = ?
        GROUP BY n.id
      `, [id]) as any[];

    const formattedItem = {
        ...updatedItem[0],
      countries: typeof updatedItem[0].countries === 'string' ? JSON.parse(updatedItem[0].countries) : updatedItem[0].countries
    };

    res.json(formattedItem);
  } catch (error) {
    await connection.rollback();
    console.error('Error updating nomenclature:', error);
    res.status(500).json({ message: 'Ошибка при обновлении номенклатуры' });
  } finally {
    connection.release();
  }
});

// Удалить товар
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM nomenclature WHERE id = ?', [req.params.id]);
    res.json(req.params.id);
  } catch (error) {
    console.error('Error deleting nomenclature:', error);
    res.status(500).json({ message: 'Ошибка при удалении номенклатуры' });
  }
});

export default router; 