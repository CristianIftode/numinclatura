import express from 'express';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Получить все валюты
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [currencies] = await pool.query('SELECT * FROM currencies ORDER BY created_at DESC') as any[];
    res.json(currencies);
  } catch (error) {
    console.error('Error fetching currencies:', error);
    res.status(500).json({ message: 'Ошибка при получении списка валют' });
  }
});

// Добавить новую валюту
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, code, is_default } = req.body;

    if (!name || !code) {
      res.status(400).json({ message: 'Название и код валюты обязательны' });
      return;
    }

    if (code.length !== 3) {
      res.status(400).json({ message: 'Код валюты должен состоять из 3 символов' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO currencies (name, code, is_default) VALUES (?, ?, ?)',
      [name, code.toUpperCase(), is_default || false]
    ) as any[];

    const [newCurrency] = await pool.query(
      'SELECT * FROM currencies WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json(newCurrency[0]);
  } catch (error: any) {
    console.error('Error creating currency:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Валюта с таким кодом уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при создании валюты' });
    }
  }
});

// Обновить валюту
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, is_default } = req.body;

    if (!name || !code) {
      res.status(400).json({ message: 'Название и код валюты обязательны' });
      return;
    }

    if (code.length !== 3) {
      res.status(400).json({ message: 'Код валюты должен состоять из 3 символов' });
      return;
    }

    await pool.query(
      'UPDATE currencies SET name = ?, code = ?, is_default = ? WHERE id = ?',
      [name, code.toUpperCase(), is_default || false, id]
    );

    const [updatedCurrency] = await pool.query(
      'SELECT * FROM currencies WHERE id = ?',
      [id]
    ) as any[];

    if (updatedCurrency.length === 0) {
      res.status(404).json({ message: 'Валюта не найдена' });
      return;
    }

    res.json(updatedCurrency[0]);
  } catch (error: any) {
    console.error('Error updating currency:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Валюта с таким кодом уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при обновлении валюты' });
    }
  }
});

// Удалить валюту
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [currency] = await pool.query(
      'SELECT * FROM currencies WHERE id = ?',
      [id]
    ) as any[];

    if (currency.length === 0) {
      res.status(404).json({ message: 'Валюта не найдена' });
      return;
    }

    await pool.query('DELETE FROM currencies WHERE id = ?', [id]);
    res.json({ message: 'Валюта успешно удалена' });
  } catch (error) {
    console.error('Error deleting currency:', error);
    res.status(500).json({ message: 'Ошибка при удалении валюты' });
  }
});

export default router; 