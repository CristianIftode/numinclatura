import express from 'express';
import { Request, Response } from 'express';
import { Connection, RowDataPacket } from 'mysql2/promise';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

interface SeasonalityPeriod {
  start_date: string | null;
  end_date: string | null;
}

interface CountrySeasonality {
  template_id: number | null;
  periods: SeasonalityPeriod[];
}

interface CountryData {
  country_id: number;
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

// Получить список номенклатуры с информацией по странам
router.get('/', authenticateToken, async (req, res) => {
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
                'sku_code', nc.sku_code,
                'type', nc.type,
                'is_new_until', DATE_FORMAT(nc.is_new_until, '%Y-%m-%d %H:%i:%s'),
                'seasonality', JSON_OBJECT(
                  'template_id', NULL,
                  'periods', COALESCE(
                    (
                      SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                          'start_date', DATE_FORMAT(ns2.start_date, '%Y-%m-%d'),
                          'end_date', DATE_FORMAT(ns2.end_date, '%Y-%m-%d')
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
router.post('/', async (req: Request<any, any, NomenclatureRequest>, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { name, countries } = req.body;
    
    // Insert nomenclature
    const [result] = await pool.query(
      'INSERT INTO nomenclature (name) VALUES (?)',
      [name]
    );
    
    const nomenclatureId = (result as any).insertId;
    
    // Insert countries and seasonality
    for (const country of countries) {
      const { country_id, sku_code, type, is_new_until, seasonality } = country;
      
      // Проверяем, нет ли уже такой страны у этого товара
      const [existingCountry] = await connection.query(
        'SELECT id FROM nomenclature_country WHERE nomenclature_id = ? AND country_id = ?',
        [nomenclatureId, country_id]
      ) as RowDataPacket[];

      if (existingCountry.length > 0) {
        continue; // Пропускаем, если страна уже существует
      }
      
      const [countryResult] = await connection.query(
        'INSERT INTO nomenclature_country (nomenclature_id, country_id, sku_code, type, is_new_until) VALUES (?, ?, ?, ?, ?)',
        [nomenclatureId, country_id, sku_code, type, is_new_until]
      );
      
      const countryLinkId = (countryResult as any).insertId;
      
      if (seasonality && seasonality.periods && seasonality.periods.length > 0) {
        // Вставляем все периоды сезонности
        const periodValues = seasonality.periods.map((period: SeasonalityPeriod) => [
          countryLinkId,
          seasonality.template_id,
          period.start_date,
          period.end_date
        ]).flat();

        const placeholders = seasonality.periods.map(() => '(?, ?, ?, ?)').join(', ');
        
        await connection.query(
          `INSERT INTO nomenclature_seasonality (nomenclature_country_id, seasonality_template_id, start_date, end_date) VALUES ${placeholders}`,
          periodValues
        );
      }
    }
    
    await connection.commit();

    // Получаем полные данные созданного товара
    const [newItem] = await pool.query(`
      SELECT 
        n.*,
        COALESCE(
          JSON_ARRAYAGG(
            IF(nc.id IS NOT NULL,
              JSON_OBJECT(
                'id', nc.id,
                'country_id', nc.country_id,
                'country_name', c.name,
                'sku_code', nc.sku_code,
                'type', nc.type,
                'is_new_until', DATE_FORMAT(nc.is_new_until, '%Y-%m-%d %H:%i:%s'),
                'seasonality', JSON_OBJECT(
                  'template_id', NULL,
                  'periods', COALESCE(
                    (
                      SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                          'start_date', DATE_FORMAT(ns2.start_date, '%Y-%m-%d'),
                          'end_date', DATE_FORMAT(ns2.end_date, '%Y-%m-%d')
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
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, countries } = req.body;

    if (!name || !countries || !Array.isArray(countries) || countries.length === 0) {
      res.status(400).json({ message: 'Название и информация по странам обязательны' });
      return;
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Обновляем основную информацию
      await connection.query(
        'UPDATE nomenclature SET name = ? WHERE id = ?',
        [name, id]
      );

      // Удаляем старую информацию по странам (каскадно удалит и сезонность)
      await connection.query(
        'DELETE FROM nomenclature_country WHERE nomenclature_id = ?',
        [id]
      );

      // Добавляем новую информацию по странам
      for (const country of countries) {
        // Добавляем связь с страной
        const [countryResult] = await connection.query(
          'INSERT INTO nomenclature_country (nomenclature_id, country_id, sku_code, type, is_new_until) VALUES (?, ?, ?, ?, ?)',
          [id, country.country_id, country.sku_code, country.type, country.is_new_until]
        ) as any[];

        const nomenclatureCountryId = countryResult.insertId;

        // Добавляем сезонность
        if (country.seasonality) {
          const { template_id, start_date, end_date } = country.seasonality;
          await connection.query(
            'INSERT INTO nomenclature_seasonality (nomenclature_country_id, seasonality_template_id, start_date, end_date) VALUES (?, ?, ?, ?)',
            [nomenclatureCountryId, template_id, start_date, end_date]
          );
        }
      }

      await connection.commit();

      // Получаем обновленный товар
      const [updatedItem] = await connection.query(`
        SELECT 
          n.*,
          COALESCE(
            JSON_ARRAYAGG(
              CASE 
                WHEN nc.id IS NOT NULL THEN
                  JSON_OBJECT(
                    'id', nc.id,
                    'country_id', nc.country_id,
                    'country_name', c.name,
                    'sku_code', nc.sku_code,
                    'type', nc.type,
                    'is_new_until', DATE_FORMAT(nc.is_new_until, '%Y-%m-%d %H:%i:%s'),
                    'seasonality', JSON_OBJECT(
                      'template_id', ns.seasonality_template_id,
                      'template_name', s.name,
                      'start_date', DATE_FORMAT(ns.start_date, '%Y-%m-%d'),
                      'end_date', DATE_FORMAT(ns.end_date, '%Y-%m-%d')
                    )
                  )
                ELSE NULL
              END
            ),
            '[]'
          ) as countries
        FROM nomenclature n
        LEFT JOIN nomenclature_country nc ON n.id = nc.nomenclature_id
        LEFT JOIN countries c ON nc.country_id = c.id
        LEFT JOIN nomenclature_seasonality ns ON nc.id = ns.nomenclature_country_id
        LEFT JOIN seasonality s ON ns.seasonality_template_id = s.id
        WHERE n.id = ?
        GROUP BY n.id
      `, [id]) as any[];

      connection.release();

      if (!updatedItem[0]) {
        res.status(404).json({ message: 'Товар не найден' });
        return;
      }

      res.json({
        ...updatedItem[0],
        countries: JSON.parse(updatedItem[0].countries || '[]')
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating nomenclature item:', error);
    res.status(500).json({ message: 'Ошибка при обновлении товара' });
  }
});

// Удалить товар
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [item] = await pool.query(
      'SELECT * FROM nomenclature WHERE id = ?',
      [id]
    ) as any[];

    if (item.length === 0) {
      res.status(404).json({ message: 'Товар не найден' });
      return;
    }

    // Удаляем товар (остальные записи удалятся каскадно)
    await pool.query('DELETE FROM nomenclature WHERE id = ?', [id]);

    res.json({ message: 'Товар успешно удален' });
  } catch (error) {
    console.error('Error deleting nomenclature item:', error);
    res.status(500).json({ message: 'Ошибка при удалении товара' });
  }
});

export default router; 