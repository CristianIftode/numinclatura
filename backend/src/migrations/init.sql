-- Создание таблицы стран
CREATE TABLE IF NOT EXISTS countries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Создание таблицы шаблонов сезонности
CREATE TABLE IF NOT EXISTS seasonality (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Создание таблицы периодов сезонности для шаблонов
CREATE TABLE IF NOT EXISTS seasonality_periods (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seasonality_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seasonality_id) REFERENCES seasonality(id) ON DELETE CASCADE
);

-- Создание таблицы номенклатуры
CREATE TABLE IF NOT EXISTS nomenclature (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Создание таблицы связи номенклатуры со странами
CREATE TABLE IF NOT EXISTS nomenclature_country (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nomenclature_id INT NOT NULL,
    country_id INT NOT NULL,
    sku_code VARCHAR(50) NOT NULL,
    type ENUM('regular', 'exclusive') NOT NULL DEFAULT 'regular',
    is_new_until DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nomenclature_id) REFERENCES nomenclature(id) ON DELETE CASCADE,
    FOREIGN KEY (country_id) REFERENCES countries(id)
);

-- Создание таблицы сезонности для номенклатуры
CREATE TABLE IF NOT EXISTS nomenclature_seasonality (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nomenclature_country_id INT NOT NULL,
    seasonality_template_id INT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (nomenclature_country_id) REFERENCES nomenclature_country(id) ON DELETE CASCADE,
    FOREIGN KEY (seasonality_template_id) REFERENCES seasonality(id)
); 