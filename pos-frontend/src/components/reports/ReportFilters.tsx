import React, { useState, useEffect } from 'react';
import { Calendar, CalendarDays, CalendarRange, History, Building, User, CreditCard } from 'lucide-react';
import { useBranch } from '../../hooks/useBranch';
import { useAuth } from '../../context/authContext';
import { reportService } from '../../services/reportService';

interface ReportFiltersProps {
  onFilterChange: (filters: any) => void;
  showBranchFilter?: boolean;
  showSellerFilter?: boolean;
  showPaymentMethodFilter?: boolean;
  initialFilters?: any;
  reportType?: 'sales' | 'expenses' | 'combined';
}

const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  onFilterChange, 
  showBranchFilter = true,
  showSellerFilter = false,
  showPaymentMethodFilter = false,
  initialFilters = {},
  reportType = 'sales'
}) => {
  const { branches } = useBranch();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    period: initialFilters.period || 'month',
    startDate: initialFilters.startDate || '',
    endDate: initialFilters.endDate || '',
    branchId: initialFilters.branchId || '',
    sellerId: initialFilters.sellerId || '',
    sellerIds: initialFilters.sellerIds || [],
    paymentMethodId: initialFilters.paymentMethodId || '',
  });
  const [availableSellers, setAvailableSellers] = useState<any[]>([]);

  // Lista de períodos predefinidos
  const periods = [
    { value: 'day', label: 'Hoy', icon: <Calendar className="h-4 w-4" /> },
    { value: 'week', label: 'Esta semana', icon: <CalendarDays className="h-4 w-4" /> },
    { value: 'month', label: 'Este mes', icon: <CalendarRange className="h-4 w-4" /> },
    { value: 'year', label: 'Este año', icon: <CalendarRange className="h-4 w-4" /> },
    { value: 'custom', label: 'Personalizado', icon: <History className="h-4 w-4" /> },
  ];

  // Calcular fechas según el período seleccionado
  const calculateDates = (period: string) => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now);
        startDate.setDate(now.getDate() + diffToMonday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        // Para 'custom', no calculamos automáticamente
        break;
    }

    return { startDate, endDate };
  };

  // Inicializar fechas cuando cambia el período
  useEffect(() => {
    if (filters.period !== 'custom') {
      const { startDate, endDate } = calculateDates(filters.period);
      const newFilters = {
        ...filters,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  }, [filters.period]);

  // Manejar cambios en los filtros
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFilters = {
      ...filters,
      [name]: value,
      ...(name === 'branchId' ? { sellerId: '', sellerIds: [] as string[] } : {})
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Si el usuario no es admin global, limitar a su sucursal
  useEffect(() => {
    if (user?.branchId && user.branchId !== null) {
      const newFilters = { ...filters, branchId: user.branchId.toString(), sellerId: '', sellerIds: [] as string[] };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  }, [user]);

  // Cargar vendedores dinámicamente según sucursal seleccionada
  useEffect(() => {
    if (!(showSellerFilter && reportType === 'sales')) return;

    const loadSellers = async () => {
      try {
        const branchId = filters.branchId ? parseInt(filters.branchId, 10) : undefined;
        const sellers = await reportService.getAvailableSellers(branchId);
        setAvailableSellers(sellers);
      } catch (error) {
        console.error('Error cargando vendedores:', error);
        setAvailableSellers([]);
      }
    };

    loadSellers();
  }, [filters.branchId, showSellerFilter, reportType]);

  const handleSellerMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSellerIds = Array.from(e.target.selectedOptions, option => option.value);
    const newFilters = {
      ...filters,
      sellerId: '',
      sellerIds: selectedSellerIds
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const selectAllUsers = () => {
    const allIds = availableSellers.map((seller) => seller.id);
    const newFilters = {
      ...filters,
      sellerId: '',
      sellerIds: allIds
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearSelectedUsers = () => {
    const newFilters = {
      ...filters,
      sellerId: '',
      sellerIds: [] as string[]
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros del Reporte</h3>
      
      <div className="space-y-6">
        {/* Selector de período */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período del Reporte
          </label>
          <div className="flex flex-wrap gap-2">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setFilters({...filters, period: p.value})}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.period === p.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fechas personalizadas (solo cuando se selecciona 'custom') */}
        {filters.period === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Filtro por sucursal */}
        {showBranchFilter && user?.branchId === null && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building className="h-4 w-4 inline mr-1" />
              Sucursal
            </label>
            <select
              name="branchId"
              value={filters.branchId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las sucursales</option>
              {branches.filter(b => b.isActive).map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filtro por vendedor (para reportes de ventas) */}
        {showSellerFilter && reportType === 'sales' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="h-4 w-4 inline mr-1" />
              Vendedor / Supervisor
            </label>
            <select
              name="sellerIds"
              multiple
              value={filters.sellerIds}
              onChange={handleSellerMultiSelectChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 min-h-32"
            >
              {availableSellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name} {seller.userCode ? `(${seller.userCode})` : ''} {seller.branch?.name ? `- ${seller.branch.name}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Si no seleccionas usuarios, se incluirán todos los vendedores/supervisores de la(s) sucursal(es) elegida(s).
            </p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={selectAllUsers}
                className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Seleccionar todos
              </button>
              <button
                type="button"
                onClick={clearSelectedUsers}
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Limpiar selección
              </button>
            </div>
          </div>
        )}

        {/* Filtro por método de pago */}
        {showPaymentMethodFilter && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CreditCard className="h-4 w-4 inline mr-1" />
              Método de Pago
            </label>
            <select
              name="paymentMethodId"
              value={filters.paymentMethodId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los métodos</option>
              <option value="1">Efectivo</option>
              <option value="2">Tarjeta</option>
              <option value="3">Transferencia</option>
            </select>
          </div>
        )}

        {/* Información del período seleccionado */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Período seleccionado:</span>{' '}
            {filters.startDate && filters.endDate 
              ? `Del ${new Date(filters.startDate).toLocaleDateString('es-BO')} al ${new Date(filters.endDate).toLocaleDateString('es-BO')}`
              : 'Selecciona un período'}
          </p>
          {filters.branchId && (
            <p className="text-sm text-blue-800 mt-1">
              <span className="font-medium">Sucursal:</span>{' '}
              {branches.find(b => b.id === parseInt(filters.branchId))?.name || 'Todas'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
