import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import testRoutes from './routes/test';
import { authMiddleware } from './middleware/auth';
import initDatabase from './database/init';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', testRoutes);

// Защищенный маршрут для проверки
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Доступ разрешен' });
});

const PORT = process.env.PORT || 3001;

// Инициализация базы данных и запуск сервера
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }); 