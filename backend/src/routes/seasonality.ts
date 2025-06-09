import express from 'express';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Получить все шаблоны сезонности
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [templates] = await pool.query(`
      SELECT s.*, 
             COALESCE(
               JSON_ARRAYAGG(
                 CASE 
                   WHEN sp.id IS NOT NULL THEN
                     JSON_OBJECT(
                       'startDate', DATE_FORMAT(sp.start_date, '%Y-%m-%d'),
                       'endDate', DATE_FORMAT(sp.end_date, '%Y-%m-%d')
                     )
                   ELSE NULL
                 END
               ),
               '[]'
             ) as periods
      FROM seasonality s
      LEFT JOIN seasonality_periods sp ON s.id = sp.seasonality_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `) as any[];

    // Преобразуем строку периодов в массив
    const formattedTemplates = templates.map((template: any) => ({
      ...template,
      periods: JSON.parse(template.periods || '[]')
    }));

    res.json(formattedTemplates);
  } catch (error) {
    console.error('Error fetching seasonality templates:', error);
    res.status(500).json({ message: 'Ошибка при получении шаблонов сезонности' });
  }
});

// Добавить новый шаблон сезонности
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, periods } = req.body;

    if (!name || !periods || !Array.isArray(periods) || periods.length === 0) {
      res.status(400).json({ message: 'Название и периоды обязательны' });
      return;
    }

    // Начинаем транзакцию
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Добавляем шаблон
      const [result] = await connection.query(
        'INSERT INTO seasonality (name) VALUES (?)',
        [name]
      ) as any[];

      const seasonalityId = result.insertId;

      // Добавляем периоды
      for (const period of periods) {
        await connection.query(
          'INSERT INTO seasonality_periods (seasonality_id, start_date, end_date) VALUES (?, ?, ?)',
          [seasonalityId, period.startDate, period.endDate]
        );
      }

      await connection.commit();

      // Получаем созданный шаблон с периодами
      const [newTemplate] = await connection.query(`
        SELECT s.*, 
               COALESCE(
                 JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'startDate', DATE_FORMAT(sp.start_date, '%Y-%m-%d'),
                     'endDate', DATE_FORMAT(sp.end_date, '%Y-%m-%d')
                   )
                 ),
                 '[]'
               ) as periods
        FROM seasonality s
        LEFT JOIN seasonality_periods sp ON s.id = sp.seasonality_id
        WHERE s.id = ?
        GROUP BY s.id
      `, [seasonalityId]) as any[];

      connection.release();

      res.status(201).json({
        ...newTemplate[0],
        periods: JSON.parse(newTemplate[0].periods || '[]')
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating seasonality template:', error);
    res.status(500).json({ message: 'Ошибка при создании шаблона сезонности' });
  }
});

// Обновить шаблон сезонности
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, periods } = req.body;

    if (!name || !periods || !Array.isArray(periods) || periods.length === 0) {
      res.status(400).json({ message: 'Название и периоды обязательны' });
      return;
    }

    // Начинаем транзакцию
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Обновляем шаблон
      await connection.query(
        'UPDATE seasonality SET name = ? WHERE id = ?',
        [name, id]
      );

      // Удаляем старые периоды
      await connection.query(
        'DELETE FROM seasonality_periods WHERE seasonality_id = ?',
        [id]
      );

      // Добавляем новые периоды
      for (const period of periods) {
        await connection.query(
          'INSERT INTO seasonality_periods (seasonality_id, start_date, end_date) VALUES (?, ?, ?)',
          [id, period.startDate, period.endDate]
        );
      }

      await connection.commit();

      // Получаем обновленный шаблон с периодами
      const [updatedTemplate] = await connection.query(`
        SELECT s.*, 
               COALESCE(
                 JSON_ARRAYAGG(
                   JSON_OBJECT(
                     'startDate', DATE_FORMAT(sp.start_date, '%Y-%m-%d'),
                     'endDate', DATE_FORMAT(sp.end_date, '%Y-%m-%d')
                   )
                 ),
                 '[]'
               ) as periods
        FROM seasonality s
        LEFT JOIN seasonality_periods sp ON s.id = sp.seasonality_id
        WHERE s.id = ?
        GROUP BY s.id
      `, [id]) as any[];

      connection.release();

      if (!updatedTemplate[0]) {
        res.status(404).json({ message: 'Шаблон не найден' });
        return;
      }

      res.json({
        ...updatedTemplate[0],
        periods: JSON.parse(updatedTemplate[0].periods || '[]')
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating seasonality template:', error);
    res.status(500).json({ message: 'Ошибка при обновлении шаблона сезонности' });
  }
});

// Удалить шаблон сезонности
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [template] = await pool.query(
      'SELECT * FROM seasonality WHERE id = ?',
      [id]
    ) as any[];

    if (template.length === 0) {
      res.status(404).json({ message: 'Шаблон не найден' });
      return;
    }

    // Удаляем шаблон (периоды удалятся автоматически благодаря ON DELETE CASCADE)
    await pool.query('DELETE FROM seasonality WHERE id = ?', [id]);

    res.json({ message: 'Шаблон успешно удален' });
  } catch (error) {
    console.error('Error deleting seasonality template:', error);
    res.status(500).json({ message: 'Ошибка при удалении шаблона сезонности' });
  }
});

export default router; 