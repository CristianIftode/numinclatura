-- Добавляем поле brand_id в таблицу nomenclature_country
ALTER TABLE nomenclature_country 
ADD COLUMN brand_id INT NULL,
ADD FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;

-- Обновляем уникальный ключ, чтобы включить brand_id
ALTER TABLE nomenclature_country 
DROP INDEX unique_sku_per_country;

ALTER TABLE nomenclature_country 
ADD UNIQUE KEY unique_sku_per_country_brand (country_id, brand_id, sku_code); 