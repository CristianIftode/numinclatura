import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { AppDispatch } from '../store';
import {
  fetchSeasonality,
  addSeasonality,
  updateSeasonality,
  deleteSeasonality
} from '../store/slices/seasonalitySlice';

interface DatePeriod {
  startDate: string;
  endDate: string;
}

interface SeasonalityTemplate {
  id: number;
  name: string;
  periods: DatePeriod[];
}

const Seasonality: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const templates = useSelector((state: any) => state.seasonality.list);
  const status = useSelector((state: any) => state.seasonality.status);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SeasonalityTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [periods, setPeriods] = useState<DatePeriod[]>([]);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSeasonality());
    }
  }, [status, dispatch]);

  const handleAddPeriod = () => {
    setPeriods([...periods, { startDate: '', endDate: '' }]);
  };

  const handlePeriodChange = (index: number, field: 'startDate' | 'endDate', value: Date | null) => {
    if (value) {
      const newPeriods = [...periods];
      newPeriods[index] = {
        ...newPeriods[index],
        [field]: value.toISOString().split('T')[0]
      };
      setPeriods(newPeriods);
    }
  };

  const handleRemovePeriod = (index: number) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!templateName.trim() || periods.length === 0) {
      alert('Заполните название шаблона и добавьте хотя бы один период');
      return;
    }

    try {
      if (editingTemplate) {
        await dispatch(updateSeasonality({
          id: editingTemplate.id,
          name: templateName,
          periods
        }));
      } else {
        await dispatch(addSeasonality({
          name: templateName,
          periods
        }));
      }
      handleCancel();
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };

  const handleEdit = (template: SeasonalityTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setPeriods(template.periods);
    setIsAddingNew(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаблон?')) {
      try {
        await dispatch(deleteSeasonality(id));
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingTemplate(null);
    setTemplateName('');
    setPeriods([]);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Шаблоны сезонности</h1>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Добавить шаблон
          </button>
        )}
      </div>

      {isAddingNew && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">
            {editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Название шаблона</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите название шаблона"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-2">Периоды дат</label>
              {periods.map((period, index) => (
                <div key={index} className="flex gap-4 mb-2 items-center">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Начало</label>
                    <DatePicker
                      selected={period.startDate ? new Date(period.startDate) : null}
                      onChange={(date) => handlePeriodChange(index, 'startDate', date)}
                      dateFormat="dd.MM.yyyy"
                      className="p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Конец</label>
                    <DatePicker
                      selected={period.endDate ? new Date(period.endDate) : null}
                      onChange={(date) => handlePeriodChange(index, 'endDate', date)}
                      dateFormat="dd.MM.yyyy"
                      className="p-2 border rounded"
                    />
                  </div>
                  <button
                    onClick={() => handleRemovePeriod(index)}
                    className="mt-6 text-red-600 hover:text-red-900"
                  >
                    Удалить
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddPeriod}
                className="mt-2 text-blue-600 hover:text-blue-900"
              >
                + Добавить период
              </button>
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
                Периоды
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.map((template: SeasonalityTemplate) => (
              <tr key={template.id}>
                <td className="px-6 py-4 whitespace-nowrap">{template.name}</td>
                <td className="px-6 py-4">
                  {template.periods.map((period, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                    </div>
                  ))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleEdit(template)}
                    className="text-yellow-600 hover:text-yellow-900 mr-3"
                  >
                    Изменить
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
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

export default Seasonality; 