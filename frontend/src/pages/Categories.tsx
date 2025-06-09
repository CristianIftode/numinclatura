import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from '../config/axios';

// Configure axios base URL
axios.defaults.baseURL = 'http://localhost:3001';

// Configure axios to include auth token in all requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  children: Category[];
}

interface CategoryForm {
  name: string;
  parent_id: number | null;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const { register, handleSubmit, reset, setValue } = useForm<CategoryForm>();

  // Загрузка категорий
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Обработка отправки формы
  const onSubmit = async (data: CategoryForm) => {
    try {
      if (editingId) {
        await axios.put(`/api/categories/${editingId}`, {
          ...data,
          parent_id: selectedParentId
        });
      } else {
        await axios.post('/api/categories', {
          ...data,
          parent_id: selectedParentId
        });
      }
      fetchCategories();
      setEditingId(null);
      setIsAddingNew(false);
      reset();
      setSelectedParentId(null);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  // Удаление категории
  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      try {
        await axios.delete(`/api/categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  // Редактирование категории
  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setValue('name', category.name);
    setSelectedParentId(category.parent_id);
    setIsAddingNew(false);
  };

  // Переключение развернутого состояния узла
  const toggleNode = (id: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  // Рекурсивный рендеринг дерева категорий
  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    return categories.map(category => (
      <div key={category.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center py-2 hover:bg-gray-50">
          {category.children.length > 0 && (
            <button
              onClick={() => toggleNode(category.id)}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {expandedNodes.has(category.id) ? '▼' : '▶'}
            </button>
          )}
          <span className="flex-grow">{category.name}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(category)}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Изменить
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Удалить
            </button>
          </div>
        </div>
        {expandedNodes.has(category.id) && category.children.length > 0 && (
          renderCategoryTree(category.children, level + 1)
        )}
      </div>
    ));
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Справочник категорий</h1>
        {!isAddingNew && !editingId && (
          <button
            onClick={() => {
              setIsAddingNew(true);
              setEditingId(null);
              reset();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Добавить категорию
          </button>
        )}
      </div>

      {(isAddingNew || editingId !== null) && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingId !== null ? 'Редактировать категорию' : 'Добавить новую категорию'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Название</label>
              <input
                {...register('name', { required: 'Название обязательно' })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Родительская категория</label>
              <select
                value={selectedParentId || ''}
                onChange={(e) => setSelectedParentId(e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Нет (корневая категория)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Сохранить
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setIsAddingNew(false);
                  reset();
                  setSelectedParentId(null);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        {categories.length > 0 ? (
          renderCategoryTree(categories)
        ) : (
          <div className="text-center text-gray-500 py-4">
            Нет добавленных категорий
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories; 