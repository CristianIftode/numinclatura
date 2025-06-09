import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fetchCurrencyRates, addCurrencyRate, updateCurrencyRate, deleteCurrencyRate } from '../store/slices/currencyRatesSlice';
import { fetchCurrencies } from '../store/slices/currencySlice';

interface CurrencyRate {
  id: number;
  currency_id: number;
  rate_date: string;
  rate_value: number;
  created_at: string;
  updated_at: string;
  currency_name?: string;
  currency_code?: string;
}

interface CurrencyRateForm {
  currency_id: number;
  rate_date: string;
  rate_value: number;
}

interface CurrencyRateFormData {
  currency_id: number;
  rate_date: Date;
  rate_value: number;
}

const CurrencyRates: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currencies = useSelector((state: RootState) => state.currencies.items);
  const rates = useSelector((state: RootState) => state.currencyRates.items);
  const loading = useSelector((state: RootState) => state.currencyRates.loading);
  const error = useSelector((state: RootState) => state.currencyRates.error);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<CurrencyRateFormData>({
    defaultValues: {
      rate_date: new Date(),
      rate_value: 0
    }
  });

  const selectedDate = watch('rate_date');

  useEffect(() => {
    const loadData = async () => {
      await dispatch(fetchCurrencies());
      await dispatch(fetchCurrencyRates());
    };
    loadData();
  }, [dispatch]);

  const onSubmit = async (formData: CurrencyRateFormData) => {
    try {
      if (!formData.rate_date) {
        throw new Error('Дата курса обязательна');
      }

      const apiData: CurrencyRateForm = {
        ...formData,
        rate_date: formData.rate_date.toISOString().split('T')[0],
        rate_value: Number(formData.rate_value)
      };

      if (editingId !== null) {
        await dispatch(updateCurrencyRate({ id: editingId, data: apiData })).unwrap();
        setEditingId(null);
      } else {
        await dispatch(addCurrencyRate(apiData)).unwrap();
        setIsAddingNew(false);
      }
      reset();
    } catch (error) {
      console.error('Failed to save currency rate:', error);
    }
  };

  const handleEdit = (rate: CurrencyRate) => {
    setEditingId(rate.id);
    setValue('currency_id', rate.currency_id);
    setValue('rate_date', new Date(rate.rate_date));
    setValue('rate_value', Number(rate.rate_value));
    setIsAddingNew(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      try {
        await dispatch(deleteCurrencyRate(id)).unwrap();
      } catch (error) {
        console.error('Failed to delete currency rate:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    reset();
  };

  const defaultCurrency = currencies.find(c => c.is_default);
  const nonDefaultCurrencies = currencies.filter(c => !c.is_default);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/currencies" className="text-blue-500 hover:text-blue-600 mb-2 inline-block">
            ← Назад к справочнику валют
          </Link>
          <h1 className="text-2xl font-bold">Таблица курсов валют</h1>
          {defaultCurrency && (
            <p className="text-gray-600 mt-2">
              Основная валюта: {defaultCurrency.name} ({defaultCurrency.code})
            </p>
          )}
        </div>
        {!isAddingNew && (
          <button
            onClick={() => {
              setIsAddingNew(true);
              setEditingId(null);
              reset();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Добавить курс
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {(isAddingNew || editingId !== null) && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingId !== null ? 'Редактировать курс' : 'Добавить новый курс'}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Валюта</label>
              <select
                {...register('currency_id', { required: 'Выберите валюту' })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите валюту</option>
                {nonDefaultCurrencies.map(currency => (
                  <option key={currency.id} value={currency.id}>
                    {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
              {errors.currency_id && (
                <p className="text-red-500 text-sm mt-1">{errors.currency_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Дата</label>
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  if (date) {
                    setValue('rate_date', date);
                  }
                }}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="dd.MM.yyyy"
                required
              />
              {errors.rate_date && (
                <p className="text-red-500 text-sm mt-1">{errors.rate_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Курс (количество единиц валюты за 1 {defaultCurrency?.code})
              </label>
              <input
                type="number"
                step="0.000001"
                {...register('rate_value', {
                  required: 'Введите курс',
                  min: { value: 0.000001, message: 'Курс должен быть больше 0' },
                  valueAsNumber: true
                })}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.rate_value && (
                <p className="text-red-500 text-sm mt-1">{errors.rate_value.message}</p>
              )}
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Валюта
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Курс
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rates.map((rate: CurrencyRate) => {
              const currency = currencies.find(c => c.id === rate.currency_id);
              return (
                <tr key={rate.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currency ? `${currency.name} (${currency.code})` : 'Неизвестная валюта'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(rate.rate_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {Number(rate.rate_value).toFixed(6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleEdit(rate)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => handleDelete(rate.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
            {rates.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  Нет добавленных курсов
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CurrencyRates; 