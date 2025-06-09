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

    // Создание таблицы стран
    await pool.query(`
      CREATE TABLE IF NOT EXISTS countries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы шаблонов сезонности
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seasonality (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы периодов для шаблонов сезонности
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seasonality_periods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seasonality_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (seasonality_id) REFERENCES seasonality(id) ON DELETE CASCADE
      )
    `);

    // Создание таблицы номенклатуры
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nomenclature (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Создание таблицы для хранения информации о товаре для каждой страны
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nomenclature_country (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomenclature_id INT NOT NULL,
        country_id INT NOT NULL,
        sku_code VARCHAR(255) NOT NULL,
        type ENUM('regular', 'exclusive') NOT NULL DEFAULT 'regular',
        is_new_until DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (nomenclature_id) REFERENCES nomenclature(id) ON DELETE CASCADE,
        FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
        UNIQUE KEY unique_sku_per_country (country_id, sku_code)
      )
    `);

    // Создание таблицы для хранения сезонности товара
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nomenclature_seasonality (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomenclature_country_id INT NOT NULL,
        seasonality_template_id INT NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (nomenclature_country_id) REFERENCES nomenclature_country(id) ON DELETE CASCADE,
        FOREIGN KEY (seasonality_template_id) REFERENCES seasonality(id) ON DELETE SET NULL,
        CHECK (
          (seasonality_template_id IS NOT NULL AND start_date IS NULL AND end_date IS NULL) OR
          (seasonality_template_id IS NULL AND start_date IS NOT NULL AND end_date IS NOT NULL)
        )
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default initDatabase; 