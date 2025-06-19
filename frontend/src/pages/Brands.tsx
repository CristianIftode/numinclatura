import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import {
  fetchBrands,
  addBrand,
  updateBrand,
  deleteBrand,
  Brand,
} from '../store/slices/brandsSlice';
import { RootState } from '../store';

const Brands: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const brands = useSelector((state: RootState) => state.brands.list);
  const status = useSelector((state: RootState) => state.brands.status);
  const error = useSelector((state: RootState) => state.brands.error);

  const [newBrandName, setNewBrandName] = useState('');
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchBrands());
    }
  }, [status, dispatch]);

  const handleAddBrand = async () => {
    if (newBrandName.trim()) {
      await dispatch(addBrand(newBrandName.trim()));
      setNewBrandName('');
    }
  };

  const handleEditClick = (brand: Brand) => {
    setEditingBrand(brand);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (editingBrand && editingBrand.name.trim()) {
      await dispatch(
        updateBrand({ id: editingBrand.id, name: editingBrand.name.trim() })
      );
      setIsEditDialogOpen(false);
      setEditingBrand(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот бренд?')) {
      await dispatch(deleteBrand(id));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Справочник брендов</h1>
        <div className="flex gap-4">
          <button
            onClick={handleAddBrand}
            disabled={!newBrandName.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300"
          >
            Добавить бренд
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Название бренда"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.map((brand: Brand) => (
              <tr key={brand.id}>
                <td className="px-6 py-4 whitespace-nowrap">{brand.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEditClick(brand)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(brand.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Редактировать бренд</h3>
            <input
              type="text"
              value={editingBrand?.name || ''}
              onChange={(e) =>
                setEditingBrand(
                  editingBrand ? { ...editingBrand, name: e.target.value } : null
                )
              }
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsEditDialogOpen(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleEditSave}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brands; 