import React from 'react';
import { Calendar, CalendarDays, CalendarRange, History } from 'lucide-react';

interface PeriodFilterProps {
  period: string;
  onPeriodChange: (period: string) => void;
}

const PeriodFilter: React.FC<PeriodFilterProps> = ({ period, onPeriodChange }) => {
  const periods = [
    { value: 'day', label: 'Hoy', icon: <Calendar className="h-4 w-4" /> },
    { value: 'week', label: 'Esta semana', icon: <CalendarDays className="h-4 w-4" /> },
    { value: 'month', label: 'Este mes', icon: <CalendarRange className="h-4 w-4" /> },
    { value: 'year', label: 'Este año', icon: <CalendarRange className="h-4 w-4" /> },
    { value: 'all', label: 'Histórico', icon: <History className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <div className="text-sm text-gray-600 mr-2 flex items-center">
        <span>Período:</span>
      </div>
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            period === p.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {p.icon}
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodFilter;