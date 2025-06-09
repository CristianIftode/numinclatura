import fs from 'fs';
import path from 'path';
import pool from '../config/database';

const initDatabase = async () => {
  try {
    // Удаляем существующие триггеры
    await pool.query('DROP TRIGGER IF EXISTS check_single_default');
    await pool.query('DROP TRIGGER IF EXISTS check_single_default_insert');
    await pool.query('DROP TRIGGER IF EXISTS check_single_default_update');

    // Создание таблицы пользователей
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы валют
    await pool.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(3) NOT NULL UNIQUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы курсов валют
    await pool.query(`
      CREATE TABLE IF NOT EXISTS currency_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        currency_id INT NOT NULL,
        rate_date DATE NOT NULL,
        rate_value DECIMAL(20, 6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_currency_date (currency_id, rate_date)
      )
    `);

    // Создание таблицы категорий
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default initDatabase; 