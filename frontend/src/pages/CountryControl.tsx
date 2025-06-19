import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import {
  fetchCountryControl,
  updateCountryControl,
} from '../store/slices/countryControlSlice';
import { Link } from 'react-router-dom';

interface CountryControlItem {
  id: number;
  name: string;
  is_controlled: boolean;
}

const CountryControl: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector((state: RootState) => state.countryControl);

  useEffect(() => {
    dispatch(fetchCountryControl());
  }, [dispatch]);

  const handleToggleControl = async (countryId: number, isControlled: boolean) => {
    try {
      await dispatch(updateCountryControl({ countryId, is_controlled: isControlled })).unwrap();
    } catch (err) {
      console.error('Failed to update country control:', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Загрузка...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">Ошибка: {error}</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link to="/dashboard" className="text-blue-500 hover:text-blue-600 mb-2 inline-block">
            ← Назад к панели управления
          </Link>
          <h1 className="text-2xl font-bold">Виды контроля</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Страна
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Контролируется
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((country: CountryControlItem) => (
              <tr key={country.id}>
                <td className="px-6 py-4 whitespace-nowrap">{country.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={country.is_controlled}
                    onChange={(e) => {
                      console.log('Toggling control for country.id:', country.id);
                      handleToggleControl(country.id, e.target.checked);
                    }}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                  Нет стран для отображения
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CountryControl;