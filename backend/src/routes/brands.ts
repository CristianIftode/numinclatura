import express from 'express';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Получить все бренды
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [brands] = await pool.query('SELECT * FROM brands ORDER BY created_at DESC') as any[];
    res.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Ошибка при получении списка брендов' });
  }
});

// Добавить новый бренд
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Название бренда обязательно' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO brands (name) VALUES (?)',
      [name]
    ) as any[];

    const [newBrand] = await pool.query(
      'SELECT * FROM brands WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json(newBrand[0]);
  } catch (error: any) {
    console.error('Error creating brand:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Бренд с таким названием уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при создании бренда' });
    }
  }
});

// Обновить бренд
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Название бренда обязательно' });
      return;
    }

    await pool.query(
      'UPDATE brands SET name = ? WHERE id = ?',
      [name, id]
    );

    const [updatedBrand] = await pool.query(
      'SELECT * FROM brands WHERE id = ?',
      [id]
    ) as any[];

    if (updatedBrand.length === 0) {
      res.status(404).json({ message: 'Бренд не найден' });
      return;
    }

    res.json(updatedBrand[0]);
  } catch (error: any) {
    console.error('Error updating brand:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Бренд с таким названием уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при обновлении бренда' });
    }
  }
});

// Удалить бренд
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [brand] = await pool.query(
      'SELECT * FROM brands WHERE id = ?',
      [id]
    ) as any[];

    if (brand.length === 0) {
      res.status(404).json({ message: 'Бренд не найден' });
      return;
    }

    await pool.query('DELETE FROM brands WHERE id = ?', [id]);
    res.json({ message: 'Бренд успешно удален' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ message: 'Ошибка при удалении бренда' });
  }
});

export default router; 