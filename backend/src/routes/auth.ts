import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Получаем пользователя из базы данных
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    ) as any[];

    const user = users[0];

    if (!user) {
      res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
      return;
    }

    // Создание JWT токена
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

export default router; 