import express from 'express';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Получить все курсы валют
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rates] = await pool.query(`
      SELECT cr.*, c.name as currency_name, c.code as currency_code 
      FROM currency_rates cr
      JOIN currencies c ON cr.currency_id = c.id
      ORDER BY cr.rate_date DESC, c.name
    `) as any[];
    res.json(rates);
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    res.status(500).json({ message: 'Ошибка при получении курсов валют' });
  }
});

// Добавить новый курс валюты
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { currency_id, rate_date, rate_value } = req.body;

    if (!currency_id || !rate_date || !rate_value) {
      res.status(400).json({ message: 'Все поля обязательны для заполнения' });
      return;
    }

    // Проверяем существование валюты
    const [currency] = await pool.query(
      'SELECT * FROM currencies WHERE id = ?',
      [currency_id]
    ) as any[];

    if (currency.length === 0) {
      res.status(404).json({ message: 'Валюта не найдена' });
      return;
    }

    // Проверяем, что валюта не является валютой по умолчанию
    if (currency[0].is_default) {
      res.status(400).json({ message: 'Нельзя добавить курс для валюты по умолчанию' });
      return;
    }

    const [result] = await pool.query(
      'INSERT INTO currency_rates (currency_id, rate_date, rate_value) VALUES (?, ?, ?)',
      [currency_id, rate_date, rate_value]
    ) as any[];

    const [newRate] = await pool.query(`
      SELECT cr.*, c.name as currency_name, c.code as currency_code 
      FROM currency_rates cr
      JOIN currencies c ON cr.currency_id = c.id
      WHERE cr.id = ?
    `, [result.insertId]) as any[];

    res.status(201).json(newRate[0]);
  } catch (error: any) {
    console.error('Error creating currency rate:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Курс для этой валюты на указанную дату уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при создании курса валюты' });
    }
  }
});

// Обновить курс валюты
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rate_date, rate_value } = req.body;

    if (!rate_date || !rate_value) {
      res.status(400).json({ message: 'Все поля обязательны для заполнения' });
      return;
    }

    // Проверяем существование курса
    const [existingRate] = await pool.query(
      'SELECT * FROM currency_rates WHERE id = ?',
      [id]
    ) as any[];

    if (existingRate.length === 0) {
      res.status(404).json({ message: 'Курс валюты не найден' });
      return;
    }

    await pool.query(
      'UPDATE currency_rates SET rate_date = ?, rate_value = ? WHERE id = ?',
      [rate_date, rate_value, id]
    );

    const [updatedRate] = await pool.query(`
      SELECT cr.*, c.name as currency_name, c.code as currency_code 
      FROM currency_rates cr
      JOIN currencies c ON cr.currency_id = c.id
      WHERE cr.id = ?
    `, [id]) as any[];

    res.json(updatedRate[0]);
  } catch (error: any) {
    console.error('Error updating currency rate:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Курс для этой валюты на указанную дату уже существует' });
    } else {
      res.status(500).json({ message: 'Ошибка при обновлении курса валюты' });
    }
  }
});

// Удалить курс валюты
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [rate] = await pool.query(
      'SELECT * FROM currency_rates WHERE id = ?',
      [id]
    ) as any[];

    if (rate.length === 0) {
      res.status(404).json({ message: 'Курс валюты не найден' });
      return;
    }

    await pool.query('DELETE FROM currency_rates WHERE id = ?', [id]);
    res.json({ message: 'Курс валюты успешно удален' });
  } catch (error) {
    console.error('Error deleting currency rate:', error);
    res.status(500).json({ message: 'Ошибка при удалении курса валюты' });
  }
});

export default router; 