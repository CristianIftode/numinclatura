import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import testRoutes from './routes/test';
import currencyRoutes from './routes/currencies';
import currencyRatesRoutes from './routes/currencyRates';
import categoryRoutes from './routes/categories';
import countriesRoutes from './routes/countries';
import brandsRoutes from './routes/brands';
import seasonalityRoutes from './routes/seasonality';
import nomenclatureRoutes from './routes/nomenclature';
import countryControlRoutes from './routes/countryControl';
import authenticateToken from './middleware/auth';
import initDatabase from './database/init';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/currency-rates', currencyRatesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/countries', countriesRoutes);
app.use('/api/brands', brandsRoutes);
app.use('/api/seasonality', seasonalityRoutes);
app.use('/api/nomenclature', nomenclatureRoutes);
app.use('/api/country-control', countryControlRoutes);
app.use('/api', testRoutes);

// Защищенный маршрут для проверки
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route' });
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