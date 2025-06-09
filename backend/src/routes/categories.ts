import express from 'express';
import pool from '../config/database';
import authenticateToken from '../middleware/auth';

const router = express.Router();

// Получить все категории
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY parent_id IS NULL DESC, name'
    ) as any[];

    // Преобразуем плоский список в иерархическую структуру
    const buildTree = (items: any[], parentId: number | null = null): any[] => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };

    res.json(buildTree(categories));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Ошибка при получении списка категорий' });
  }
});

// Добавить новую категорию
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Название категории обязательно' });
    }

    // Проверяем существование родительской категории, если она указана
    if (parent_id) {
      const [parent] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [parent_id]
      ) as any[];

      if (parent.length === 0) {
        return res.status(400).json({ message: 'Родительская категория не найдена' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, parent_id) VALUES (?, ?)',
      [name, parent_id || null]
    ) as any[];

    const [newCategory] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [result.insertId]
    ) as any[];

    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Ошибка при создании категории' });
  }
});

// Обновить категорию
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Название категории обязательно' });
    }

    // Проверяем, что категория существует
    const [existingCategory] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    ) as any[];

    if (existingCategory.length === 0) {
      return res.status(404).json({ message: 'Категория не найдена' });
    }

    // Проверяем, что новый родитель существует
    if (parent_id) {
      const [parent] = await pool.query(
        'SELECT id FROM categories WHERE id = ?',
        [parent_id]
      ) as any[];

      if (parent.length === 0) {
        return res.status(400).json({ message: 'Родительская категория не найдена' });
      }

      // Проверяем, что новый родитель не является потомком текущей категории
      const [descendants] = await pool.query(`
        WITH RECURSIVE CategoryTree AS (
          SELECT id FROM categories WHERE id = ?
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN CategoryTree ct ON c.parent_id = ct.id
        )
        SELECT id FROM CategoryTree
      `, [id]) as any[];

      if (descendants.some((desc: any) => desc.id === parent_id)) {
        return res.status(400).json({ 
          message: 'Нельзя переместить категорию в одну из её подкатегорий' 
        });
      }
    }

    await pool.query(
      'UPDATE categories SET name = ?, parent_id = ? WHERE id = ?',
      [name, parent_id || null, id]
    );

    const [updatedCategory] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    ) as any[];

    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Ошибка при обновлении категории' });
  }
});

// Удалить категорию
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [category] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    ) as any[];

    if (category.length === 0) {
      return res.status(404).json({ message: 'Категория не найдена' });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Категория успешно удалена' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Ошибка при удалении категории' });
  }
});

export default router; 