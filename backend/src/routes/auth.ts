import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

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

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

router.post('/change-password', authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Получаем текущего пользователя из базы данных
    const [users] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    ) as any[];

    const user = users[0];

    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }

    // Проверяем текущий пароль
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      res.status(401).json({ message: 'Неверный текущий пароль' });
      return;
    }

    // Хешируем новый пароль
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль в базе данных
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );

    res.json({ message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
});

export default router; 