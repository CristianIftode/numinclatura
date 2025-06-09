import express from 'express';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Получить все страны
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [countries] = await pool.query('SELECT * FROM countries ORDER BY created_at DESC') as any[];
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Ошибка при получении списка стран' });
  }
});

// Добавить новую страну
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Название страны обязательно' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO countries (name) VALUES (?)',
      [name]
    ) as any[];

    const [newCountry] = await pool.query(
      'SELECT * FROM countries WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json(newCountry[0]);
  } catch (error: any) {
    console.error('Error creating country:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Страна с таким названием уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при создании страны' });
    }
  }
});

// Обновить страну
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Название страны обязательно' });
      return;
    }

    await pool.query(
      'UPDATE countries SET name = ? WHERE id = ?',
      [name, id]
    );

    const [updatedCountry] = await pool.query(
      'SELECT * FROM countries WHERE id = ?',
      [id]
    ) as any[];

    if (updatedCountry.length === 0) {
      res.status(404).json({ message: 'Страна не найдена' });
      return;
    }

    res.json(updatedCountry[0]);
  } catch (error: any) {
    console.error('Error updating country:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Страна с таким названием уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при обновлении страны' });
    }
  }
});

// Удалить страну
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [country] = await pool.query(
      'SELECT * FROM countries WHERE id = ?',
      [id]
    ) as any[];

    if (country.length === 0) {
      res.status(404).json({ message: 'Страна не найдена' });
      return;
    }

    await pool.query('DELETE FROM countries WHERE id = ?', [id]);
    res.json({ message: 'Страна успешно удалена' });
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({ message: 'Ошибка при удалении страны' });
  }
});

export default router; 