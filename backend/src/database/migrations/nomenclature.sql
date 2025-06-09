-- Таблица номенклатуры (основная информация о товаре)
CREATE TABLE IF NOT EXISTS nomenclature (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица для хранения информации о товаре для каждой страны
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
);

-- Таблица для хранения сезонности товара
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
); 