import express from 'express';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Получить все страны со статусом контроля
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [countries] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        COALESCE(cc.is_controlled, FALSE) AS is_controlled
      FROM countries c
      LEFT JOIN country_control cc ON c.id = cc.country_id
      ORDER BY c.name
    `) as any[];

    res.json(countries);
  } catch (error) {
    console.error('Error fetching country control data:', error);
    res.status(500).json({ message: 'Ошибка при получении данных о контроле стран' });
  }
});

// Обновить статус контроля для страны
router.put('/:countryId', authenticateToken, async (req, res) => {
  try {
    const { countryId } = req.params;
    const { is_controlled } = req.body;

    if (typeof is_controlled !== 'boolean') {
      res.status(400).json({ message: 'Неверный формат данных is_controlled' });
      return;
    }

    // Проверяем, существует ли запись для этой страны
    const [existingControl] = await pool.query(
      'SELECT id FROM country_control WHERE country_id = ?',
      [countryId]
    ) as any[];

    if (existingControl.length > 0) {
      // Обновляем существующую запись
      await pool.query(
        'UPDATE country_control SET is_controlled = ? WHERE country_id = ?',
        [is_controlled, countryId]
      );
    } else {
      // Вставляем новую запись
      await pool.query(
        'INSERT INTO country_control (country_id, is_controlled) VALUES (?, ?)',
        [countryId, is_controlled]
      );
    }

    const [updatedCountryControl] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        COALESCE(cc.is_controlled, FALSE) AS is_controlled
      FROM countries c
      LEFT JOIN country_control cc ON c.id = cc.country_id
      WHERE c.id = ?
    `, [countryId]) as any[];

    if (updatedCountryControl.length === 0) {
      res.status(404).json({ message: 'Страна не найдена' });
      return;
    }

    res.json(updatedCountryControl[0]);

  } catch (error) {
    console.error('Error updating country control data:', error);
    res.status(500).json({ message: 'Ошибка при обновлении данных о контроле страны' });
  }
});

export default router; 