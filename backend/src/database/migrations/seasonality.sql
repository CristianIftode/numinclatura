-- Таблица шаблонов сезонности
CREATE TABLE IF NOT EXISTS seasonality (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Таблица периодов для шаблонов сезонности
CREATE TABLE IF NOT EXISTS seasonality_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seasonality_id INT NOT NULL,
    start_day_of_year INT NOT NULL,
    end_day_of_year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seasonality_id) REFERENCES seasonality(id) ON DELETE CASCADE
); 