import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Currency, fetchCurrencies, addCurrency, updateCurrency, deleteCurrency } from '../store/slices/currencySlice';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

interface CurrencyForm {
  name: string;
  code: string;
  is_default: boolean;
}

const Currencies: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currencies = useSelector((state: RootState) => state.currency.items);
  const loading = useSelector((state: RootState) => state.currency.loading);
  const error = useSelector((state: RootState) => state.currency.error);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<CurrencyForm>();

  useEffect(() => {
    dispatch(fetchCurrencies());
  }, [dispatch]);

  const onSubmit = async (data: CurrencyForm) => {
    try {
      if (editingId !== null) {
        await dispatch(updateCurrency({ id: editingId, data })).unwrap();
        setEditingId(null);
      } else {
        await dispatch(addCurrency(data)).unwrap();
        setIsAddingNew(false);
      }
      reset();
    } catch (error) {
      console.error('Failed to save currency:', error);
    }
  };

  const handleEdit = (currency: Currency) => {
    setEditingId(currency.id);
    setValue('name', currency.name);
    setValue('code', currency.code);
    setValue('is_default', currency.is_default);
    setIsAddingNew(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту валюту?')) {
      try {
        await dispatch(deleteCurrency(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete currency:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    reset();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Справочник валют</h1>
        <div className="flex gap-4">
          <Link
            to="/currency-rates"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
          >
            Таблица курсов валют
          </Link>
          {!isAddingNew && (
            <button
              onClick={() => {
                setIsAddingNew(true);
                setEditingId(null);
                reset();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Добавить валюту
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {(isAddingNew || editingId !== null) && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingId !== null ? 'Редактировать валюту' : 'Добавить новую валюту'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Название</label>
              <input
                {...register('name', { required: 'Название обязательно' })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Код валюты (3 символа)</label>
              <input
                {...register('code', {
                  required: 'Код валюты обязателен',
                  pattern: {
                    value: /^[A-Za-z]{3}$/,
                    message: 'Код должен состоять из 3 букв'
                  }
                })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={3}
              />
              {errors.code && (
                <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register('is_default')}
                className="mr-2"
              />
              <label className="text-sm text-gray-600">Использовать как валюту по умолчанию</label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Название
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Код
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                По умолчанию
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currencies.map((currency: Currency) => (
              <tr key={currency.id}>
                <td className="px-6 py-4 whitespace-nowrap">{currency.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{currency.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {currency.is_default ? 'Да' : 'Нет'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(currency)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Редактировать
                  </button>
                  {!currency.is_default && (
                    <button
                      onClick={() => handleDelete(currency.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {currencies.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Нет добавленных валют
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Currencies; 