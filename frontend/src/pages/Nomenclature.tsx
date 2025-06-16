import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import DatePicker from 'react-datepicker';
import { DateRange } from 'react-date-range';
import "react-datepicker/dist/react-datepicker.css";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import ru from 'date-fns/locale/ru';
import {
  fetchNomenclature,
  addNomenclature,
  updateNomenclature,
  deleteNomenclature
} from '../store/slices/nomenclatureSlice';
import { fetchCountries } from '../store/slices/countriesSlice';
import { fetchSeasonality } from '../store/slices/seasonalitySlice';
import { CountryInfo, NomenclatureItem } from '../types/nomenclature';

// Form interfaces (using Date objects)
interface FormSeasonalityPeriod {
  start_date: Date | undefined;
  end_date: Date | undefined;
}

interface FormSeasonality {
  template_id: number | null;
  periods: FormSeasonalityPeriod[];
}

interface FormCountry {
  country_id: number;
  sku_code: string;
  type: 'regular' | 'exclusive';
  is_new_until: Date | undefined;
  seasonality: FormSeasonality;
}

// API interfaces (using strings)
interface ApiSeasonalityPeriod {
  start_date: string | null;
  end_date: string | null;
}

interface ApiSeasonality {
  template_id: number | null;
  periods: ApiSeasonalityPeriod[];
}

interface ApiCountry {
  country_id: number;
  sku_code: string;
  type: 'regular' | 'exclusive';
  is_new_until: string | null;
  seasonality: ApiSeasonality;
}

const Nomenclature: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: any) => state.nomenclature.list);
  const countries = useSelector((state: any) => state.countries.list);
  const templates = useSelector((state: any) => state.seasonality.list);
  const status = useSelector((state: any) => state.nomenclature.status);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemName, setItemName] = useState('');
  const [countryForms, setCountryForms] = useState<FormCountry[]>([]);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchNomenclature());
      dispatch(fetchCountries());
      dispatch(fetchSeasonality());
    }
  }, [status, dispatch]);

  const handleAddCountry = () => {
    setCountryForms([
      ...countryForms,
      {
        country_id: 0,
        sku_code: '',
        type: 'regular',
        is_new_until: undefined,
        seasonality: {
          template_id: null,
          periods: []
        }
      }
    ]);
  };

  const handleCountryChange = (index: number, field: keyof FormCountry, value: any) => {
    const newForms = [...countryForms];
    if (field === 'seasonality') {
      if (value.template_id !== undefined) {
        // Находим выбранный шаблон
        const selectedTemplate = templates.find((t: any) => t.id === value.template_id);
        
        if (selectedTemplate && selectedTemplate.periods.length > 0) {
          // Копируем периоды из шаблона
          const templatePeriods = selectedTemplate.periods.map((period: any) => ({
            start_date: period.startDate ? new Date(period.startDate) : null,
            end_date: period.endDate ? new Date(period.endDate) : null
          }));
          
          newForms[index].seasonality = {
            ...newForms[index].seasonality,
            template_id: null, // Не сохраняем ID шаблона
            periods: templatePeriods // Сохраняем только периоды
          };
        } else {
          newForms[index].seasonality = {
            ...newForms[index].seasonality,
            template_id: null,
            periods: []
          };
        }
      } else if (value.periods) {
        newForms[index].seasonality = {
          ...newForms[index].seasonality,
          template_id: null,
          periods: value.periods
        };
      }
    } else {
      (newForms[index] as any)[field] = value;
    }
    setCountryForms(newForms);
  };

  const handleAddPeriod = (countryIndex: number) => {
    const newForms = [...countryForms];
    newForms[countryIndex].seasonality.periods.push({
      start_date: undefined,
      end_date: undefined
    });
    setCountryForms(newForms);
  };

  const handleRemovePeriod = (countryIndex: number, periodIndex: number) => {
    const newForms = [...countryForms];
    newForms[countryIndex].seasonality.periods.splice(periodIndex, 1);
    setCountryForms(newForms);
  };

  const handlePeriodChange = (countryIndex: number, periodIndex: number, field: keyof FormSeasonalityPeriod, value: Date | undefined) => {
    const newForms = [...countryForms];
    newForms[countryIndex].seasonality.periods[periodIndex][field] = value;
    setCountryForms(newForms);
  };

  const handleRemoveCountry = (index: number) => {
    setCountryForms(countryForms.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!itemName.trim() || countryForms.length === 0) {
      alert('Заполните название товара и добавьте хотя бы одну страну');
      return;
    }

    const isValid = countryForms.every(form => 
      form.country_id && form.sku_code && form.seasonality.periods.length > 0
    );

    if (!isValid) {
      alert('Заполните все обязательные поля для каждой страны');
      return;
    }

    const formattedCountries: Omit<CountryInfo, 'id' | 'country_name'>[] = countryForms.map(form => ({
      country_id: form.country_id,
      sku_code: form.sku_code,
      type: form.type,
      is_new_until: form.is_new_until ? form.is_new_until.toISOString() : null,
      seasonality: {
        template_id: null,
        periods: form.seasonality.periods.map(period => ({
          start_date: period.start_date ? period.start_date.toISOString().split('T')[0] : null,
          end_date: period.end_date ? period.end_date.toISOString().split('T')[0] : null
        }))
      }
    }));

    try {
      if (editingItem) {
        await dispatch(updateNomenclature({
          id: editingItem.id,
          name: itemName,
          countries: formattedCountries
        }));
      } else {
        await dispatch(addNomenclature({
          name: itemName,
          countries: formattedCountries
        }));
      }
      handleCancel();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setItemName(item.name);
    setCountryForms((item.countries || []).map((country: any) => ({
      country_id: country.country_id,
      sku_code: country.sku_code,
      type: country.type,
      is_new_until: country.is_new_until ? new Date(country.is_new_until) : null,
      seasonality: {
        template_id: null,
        periods: (country.seasonality?.periods || []).map((period: any) => ({
          start_date: period.start_date ? new Date(period.start_date) : null,
          end_date: period.end_date ? new Date(period.end_date) : null
        }))
      }
    })));
    setIsAddingNew(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await dispatch(deleteNomenclature(id));
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingItem(null);
    setItemName('');
    setCountryForms([]);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Номенклатура</h1>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Добавить товар
          </button>
        )}
      </div>

      {isAddingNew && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Редактировать товар' : 'Новый товар'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Название товара</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название товара"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-gray-600">Информация по странам</label>
                <button
                  onClick={handleAddCountry}
                  className="text-blue-600 hover:text-blue-900"
                >
                  + Добавить страну
                </button>
              </div>
              
              {countryForms.map((form, countryIndex) => (
                <div key={countryIndex} className="mb-4 p-4 border rounded">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Страна</label>
                      <select
                        value={form.country_id}
                        onChange={(e) => handleCountryChange(countryIndex, 'country_id', Number(e.target.value))}
                        className="w-full p-2 border rounded"
                      >
                        <option value={0}>Выберите страну</option>
                        {countries.map((country: any) => (
                          <option key={country.id} value={country.id}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Артикул (SKU)</label>
                      <input
                        type="text"
                        value={form.sku_code}
                        onChange={(e) => handleCountryChange(countryIndex, 'sku_code', e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Введите артикул"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Тип</label>
                      <select
                        value={form.type}
                        onChange={(e) => handleCountryChange(countryIndex, 'type', e.target.value as 'regular' | 'exclusive')}
                        className="w-full p-2 border rounded"
                      >
                        <option value="regular">Обычный</option>
                        <option value="exclusive">Эксклюзив</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Новинка до</label>
                      <DatePicker
                        selected={form.is_new_until}
                        onChange={(date: Date | null) => {
                          if (date) {
                            handleCountryChange(countryIndex, 'is_new_until', date);
                          }
                        }}
                        className="w-full p-2 border rounded"
                        dateFormat="dd.MM.yyyy"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Сезонность</label>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Шаблон сезонности</label>
                        <select
                          value={form.seasonality.template_id || ''}
                          onChange={(e) => {
                            const value = e.target.value ? Number(e.target.value) : null;
                            handleCountryChange(countryIndex, 'seasonality', {
                              template_id: value
                            });
                          }}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Выберите шаблон</option>
                          {templates.map((template: any) => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm text-gray-600">Периоды</label>
                          <button
                            type="button"
                            onClick={() => handleAddPeriod(countryIndex)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Добавить период
                          </button>
                        </div>

                        {form.seasonality.periods.map((period, periodIndex) => (
                          <div key={periodIndex} className="mb-4 p-4 border rounded bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm text-gray-600">Период {periodIndex + 1}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePeriod(countryIndex, periodIndex)}
                                className="px-2 py-1 text-sm text-red-500 hover:text-red-600"
                              >
                                Удалить
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Период</label>
                                <DateRange
                                  ranges={[{
                                    startDate: period.start_date,
                                    endDate: period.end_date,
                                    key: 'selection'
                                  }]}
                                  onChange={(ranges) => {
                                    handlePeriodChange(countryIndex, periodIndex, 'start_date', ranges.selection.startDate);
                                    handlePeriodChange(countryIndex, periodIndex, 'end_date', ranges.selection.endDate);
                                  }}
                                  moveRangeOnFirstSelection={false}
                                  className="w-full"
                                  locale={ru}
                                  months={1}
                                  direction="horizontal"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveCountry(countryIndex)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Удалить страну
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
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
                Страны
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item: any) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                <td className="px-6 py-4">
                  {(item.countries || []).map((country: any, index: number) => (
                    <div key={index} className="mb-2">
                      <div className="font-medium">{country.country_name}</div>
                      <div className="text-sm text-gray-600">
                        Артикул: {country.sku_code} | 
                        Тип: {country.type === 'regular' ? 'Обычный' : 'Эксклюзив'}
                        {country.is_new_until && ` | Новинка до: ${new Date(country.is_new_until).toLocaleDateString()}`}
                      </div>
                      <div className="text-sm text-gray-600">
                        Сезонность:
                        {(country.seasonality?.periods && country.seasonality.periods.length > 0) ? (
                          <div className="ml-2">
                            {country.seasonality.periods.map((period: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                Период {idx + 1}: {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="ml-1">Не указана</span>
                        )}
                      </div>
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
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
    </div>
  );
};

export default Nomenclature; 