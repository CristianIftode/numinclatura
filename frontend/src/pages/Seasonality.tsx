import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../store';
import {
  fetchSeasonality,
  addSeasonality,
  updateSeasonality,
  deleteSeasonality
} from '../store/slices/seasonalitySlice';

// Новый компонент для выбора периодов по дням года
export interface DayRange {
  startDayOfYear: number;
  endDayOfYear: number;
  markupPercentage: number | null;
  tolerancePercentage: number | null;
}

export const MONTHS: string[] = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];
export const DAYS_IN_MONTH: readonly number[] = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function getDayOfYear(month: number, day: number) {
  let dayOfYear = day;
  for (let i = 0; i < month; i++) {
    dayOfYear += DAYS_IN_MONTH[i];
  }
  return dayOfYear;
}

export function getMonthDayFromDayOfYear(dayOfYear: number) {
  if (dayOfYear < 1 || dayOfYear > 366) {
    return { month: 'Январь', day: 1 };
  }
  
  let remainingDays = dayOfYear;
  let monthIndex = 0;
  
  while (monthIndex < DAYS_IN_MONTH.length && remainingDays > DAYS_IN_MONTH[monthIndex]) {
    remainingDays -= DAYS_IN_MONTH[monthIndex];
    monthIndex++;
  }
  
  return { month: MONTHS[monthIndex], day: remainingDays };
}

interface DayOfYearRangeGridProps {
  periods: DayRange[];
  setPeriods: (periods: DayRange[]) => void;
}

export const DayOfYearRangeGrid: React.FC<DayOfYearRangeGridProps> = ({ periods, setPeriods }) => {
  const [selecting, setSelecting] = React.useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [hoverDay, setHoverDay] = React.useState<number | null>(null);

  const resetSelection = () => setSelecting({ start: null, end: null });

  const isDaySelected = (dayOfYear: number) => {
    for (const p of periods) {
      if (dayOfYear >= p.startDayOfYear && dayOfYear <= p.endDayOfYear) return true;
    }
    if (selecting.start !== null && selecting.end !== null) {
      const [s, e] = [selecting.start, selecting.end].sort((a, b) => a - b);
      if (dayOfYear >= s && dayOfYear <= e) return true;
    }
    return false;
  };

  const isDayInCurrentSelection = (dayOfYear: number) => {
    if (selecting.start !== null && hoverDay !== null) {
      const [s, e] = [selecting.start, hoverDay].sort((a, b) => a - b);
      return dayOfYear >= s && dayOfYear <= e;
    }
    return false;
  };

  const isOverlapping = (start: number, end: number) => {
    for (const p of periods) {
      if (Math.max(start, p.startDayOfYear) <= Math.min(end, p.endDayOfYear)) return true;
    }
    return false;
  };

  const handleDayClick = (dayOfYear: number) => {
    if (selecting.start === null) {
      setSelecting({ start: dayOfYear, end: null });
      setHoverDay(null);
    } else if (selecting.start !== null && selecting.end === null) {
      const [start, end] = [selecting.start, dayOfYear].sort((a, b) => a - b);
      if (isOverlapping(start, end)) {
        alert('Периоды не должны пересекаться!');
        resetSelection();
        return;
      }
      setPeriods([...periods, { startDayOfYear: start, endDayOfYear: end, markupPercentage: null, tolerancePercentage: null }]);
      resetSelection();
    }
  };

  const handleDayMouseOver = (dayOfYear: number) => {
    if (selecting.start !== null && selecting.end === null) {
      setHoverDay(dayOfYear);
    }
  };

  const handleRemovePeriod = (index: number) => {
    setPeriods(periods.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="overflow-x-auto max-h-[200px]">
        <table className="border-collapse">
          <thead className="sticky top-0 bg-white">
            <tr>
              {MONTHS.map((month, mIdx) => (
                <th key={month} colSpan={DAYS_IN_MONTH[mIdx]} className="text-center px-1 py-1 border-b text-xs font-bold">
                  {month}
                </th>
              ))}
            </tr>
            <tr>
              {DAYS_IN_MONTH.map((days, mIdx) => (
                Array.from({ length: days }, (_, dIdx) => (
                  <th key={mIdx + '-' + dIdx} className="text-center px-1 py-0 border-b text-[10px] font-normal">
                    {dIdx + 1}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {DAYS_IN_MONTH.map((days, mIdx) => (
                Array.from({ length: days }, (_, dIdx) => {
                  const dayOfYear = getDayOfYear(mIdx, dIdx + 1);
                  const selected = isDaySelected(dayOfYear);
                  const inCurrent = isDayInCurrentSelection(dayOfYear);
                  const isEvenMonth = mIdx % 2 === 0;
                  return (
                    <td
                      key={mIdx + '-' + dIdx}
                      className={`w-6 h-6 cursor-pointer border ${selected ? 'bg-green-300' : inCurrent ? 'bg-green-100' : isEvenMonth ? 'bg-gray-100' : 'bg-white'}`}
                      onClick={() => handleDayClick(dayOfYear)}
                      onMouseOver={() => handleDayMouseOver(dayOfYear)}
                    />
                  );
                })
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-6">
        <label className="block text-sm text-gray-600 mb-2">Выбранные периоды:</label>
        {periods.map((period, index) => {
          const start = getMonthDayFromDayOfYear(period.startDayOfYear);
          const end = getMonthDayFromDayOfYear(period.endDayOfYear);

          const handlePeriodChange = (field: 'markupPercentage' | 'tolerancePercentage', value: number | null) => {
            const newPeriods = [...periods];
            newPeriods[index] = { ...newPeriods[index], [field]: value };
            setPeriods(newPeriods);
          };

          return (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded mb-2">
              <div className="flex-grow">
                <span className="text-sm">
                  {`${start.month} ${start.day}`} - {`${end.month} ${end.day}`}
                  {` (дни года: ${period.startDayOfYear} - ${period.endDayOfYear})`}
                </span>
                <div className="mt-2 flex space-x-2">
                  <div>
                    <label className="block text-xs text-gray-500">Наценка %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={period.markupPercentage !== null && period.markupPercentage !== undefined ? period.markupPercentage : ''}
                      onChange={(e) => handlePeriodChange('markupPercentage', e.target.value === '' ? null : parseFloat(e.target.value))}
                      className="w-20 p-1 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">Допуск %</label>
                    <input
                      type="number"
                      step="0.01"
                      value={period.tolerancePercentage !== null && period.tolerancePercentage !== undefined ? period.tolerancePercentage : ''}
                      onChange={(e) => handlePeriodChange('tolerancePercentage', e.target.value === '' ? null : parseFloat(e.target.value))}
                      className="w-20 p-1 border rounded text-xs"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemovePeriod(index)}
                className="text-red-600 hover:text-red-900 ml-4"
              >
                Удалить
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SeasonalityTemplate {
  id: number;
  name: string;
  periods: DayRange[];
}

const Seasonality: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const templates = useSelector((state: any) => state.seasonality.list);
  const status = useSelector((state: any) => state.seasonality.status);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SeasonalityTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [periods, setPeriods] = useState<DayRange[]>([]);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSeasonality());
    }
  }, [status, dispatch]);

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
              <label className="block text-sm text-gray-600 mb-2">Выберите периоды (без привязки к году)</label>
              <DayOfYearRangeGrid periods={periods} setPeriods={setPeriods} />
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
                  {template.periods.map((period, index) => {
                    const start = getMonthDayFromDayOfYear(period.startDayOfYear);
                    const end = getMonthDayFromDayOfYear(period.endDayOfYear);
                    return (
                    <div key={index} className="text-sm text-gray-600">
                        {`${start.month} ${start.day}`} - {`${end.month} ${end.day}`}
                        {` (дни года: ${period.startDayOfYear} - ${period.endDayOfYear})`}
                    </div>
                    );
                  })}
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