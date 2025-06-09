import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import {
  fetchCountries,
  addCountry,
  updateCountry,
  deleteCountry,
} from '../store/slices/countriesSlice';

const Countries: React.FC = () => {
  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const countries = useSelector((state: any) => state.countries.list);
  const status = useSelector((state: any) => state.countries.status);

  const [newCountryName, setNewCountryName] = useState('');
  const [editingCountry, setEditingCountry] = useState<{ id: number; name: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCountries());
    }
  }, [status, dispatch]);

  const handleAddCountry = async () => {
    if (newCountryName.trim()) {
      await dispatch(addCountry(newCountryName.trim()));
      setNewCountryName('');
    }
  };

  const handleEditClick = (country: { id: number; name: string }) => {
    setEditingCountry(country);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (editingCountry && editingCountry.name.trim()) {
      await dispatch(
        updateCountry({ id: editingCountry.id, name: editingCountry.name.trim() })
      );
      setIsEditDialogOpen(false);
      setEditingCountry(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту страну?')) {
      await dispatch(deleteCountry(id));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Справочник стран</h1>
        <div className="flex gap-4">
          <button
            onClick={handleAddCountry}
            disabled={!newCountryName.trim()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300"
          >
            Добавить страну
          </button>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Название страны"
            value={newCountryName}
            onChange={(e) => setNewCountryName(e.target.value)}
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
            {countries.map((country: { id: number; name: string }) => (
              <tr key={country.id}>
                <td className="px-6 py-4 whitespace-nowrap">{country.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEditClick(country)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(country.id)}
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
            <h3 className="text-xl font-semibold mb-4">Редактировать страну</h3>
            <input
              type="text"
              value={editingCountry?.name || ''}
              onChange={(e) =>
                setEditingCountry(
                  editingCountry ? { ...editingCountry, name: e.target.value } : null
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

export default Countries; 