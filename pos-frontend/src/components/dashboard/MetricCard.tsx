import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  color = 'blue'
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    neutral: <Minus className="h-4 w-4" />
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return trendIcons.up;
    if (value < 0) return trendIcons.down;
    return trendIcons.neutral;
  };

  // Formatear el valor si es número
  const formattedValue = typeof value === 'number' ? 
    (value % 1 === 0 ? value.toString() : value.toFixed(2)) : 
    value;

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold">{formattedValue}</p>
          {subtitle && <p className="text-sm mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm">
          <span className="flex items-center mr-2">
            {getTrendIcon(trend.value)}
            <span className="ml-1 font-medium">{Math.abs(trend.value)}%</span>
          </span>
          <span className="text-gray-600">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;