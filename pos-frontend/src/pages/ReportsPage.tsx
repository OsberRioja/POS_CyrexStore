import { useState } from 'react';
import { useAuth } from '../context/authContext';
//import { useBranch } from '../hooks/useBranch';
import ReportFilters from '../components/reports/ReportFilters';
import { reportService } from '../services/reportService';
import { FileText, Download, BarChart3, CreditCard, Receipt } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  //const { currentBranchId } = useBranch();
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState<'sales' | 'expenses' | 'combined'>('sales');
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: '',
    branchId: user?.branchId ? user.branchId.toString() : '',
    sellerId: '',
    paymentMethodId: ''
  });

  // Manejar cambio de filtros
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Descargar reporte según el tipo activo
  const handleDownloadReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      alert('Por favor, selecciona un período válido');
      return;
    }

    setLoading(true);
    try {
      switch (activeReport) {
        case 'sales':
          await reportService.downloadPeriodSalesReport(
            filters.startDate,
            filters.endDate,
            filters.branchId ? parseInt(filters.branchId) : undefined,
            filters.sellerId || undefined,
            filters.paymentMethodId ? parseInt(filters.paymentMethodId) : undefined
          );
          break;
        case 'expenses':
          await reportService.downloadPeriodExpensesReport(
            filters.startDate,
            filters.endDate,
            filters.branchId ? parseInt(filters.branchId) : undefined,
            filters.paymentMethodId ? parseInt(filters.paymentMethodId) : undefined
          );
          break;
        case 'combined':
          await reportService.downloadCombinedReport(
            filters.startDate,
            filters.endDate,
            filters.branchId ? parseInt(filters.branchId) : undefined
          );
          break;
      }
    } catch (error: any) {
      console.error('Error descargando reporte:', error);
      alert(error.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // Descargar reporte mensual (opción rápida)
  const handleDownloadMonthlyReport = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // getMonth() es 0-indexed
    
    setLoading(true);
    try {
      await reportService.downloadMonthlySalesReport(
        year,
        month,
        filters.branchId ? parseInt(filters.branchId) : undefined
      );
    } catch (error: any) {
      console.error('Error descargando reporte mensual:', error);
      alert(error.message || 'Error al generar el reporte mensual');
    } finally {
      setLoading(false);
    }
  };

  // Tipos de reporte disponibles
  const reportTypes = [
    {
      id: 'sales',
      name: 'Reporte de Ventas',
      description: 'Detalle de ventas, métodos de pago y vendedores',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'blue'
    },
    {
      id: 'expenses',
      name: 'Reporte de Gastos',
      description: 'Detalle de gastos y desembolsos',
      icon: <CreditCard className="h-6 w-6" />,
      color: 'red'
    },
    {
      id: 'combined',
      name: 'Reporte Combinado',
      description: 'Ventas y gastos en un solo reporte',
      icon: <Receipt className="h-6 w-6" />,
      color: 'green'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Reportes del Sistema</h1>
            <p className="text-gray-600">
              Genera reportes detallados de ventas, gastos y más
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={handleDownloadMonthlyReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download size={18} />
              {loading ? 'Generando...' : 'Descargar Mes Actual'}
            </button>
          </div>
        </div>

        {/* Selector de tipo de reporte */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Reporte</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                onClick={() => setActiveReport(report.id as any)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  activeReport === report.id
                    ? `border-${report.color}-300 bg-${report.color}-50`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${report.color}-100 text-${report.color}-600`}>
                    {report.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{report.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  </div>
                  {activeReport === report.id && (
                    <div className="ml-auto">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtros del reporte */}
        <ReportFilters
          onFilterChange={handleFilterChange}
          showBranchFilter={user?.branchId === null}
          showSellerFilter={activeReport === 'sales'}
          showPaymentMethodFilter={true}
          reportType={activeReport}
          initialFilters={filters}
        />

        {/* Botón de descarga */}
        <div className="flex justify-end">
          <button
            onClick={handleDownloadReport}
            disabled={loading || !filters.startDate || !filters.endDate}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText size={20} />
            {loading ? 'Generando Reporte...' : `Descargar Reporte de ${reportTypes.find(r => r.id === activeReport)?.name}`}
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información sobre los Reportes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">📊 Reporte de Ventas incluye:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Detalle completo de todas las ventas</li>
              <li>• Resumen por método de pago</li>
              <li>• Estadísticas por vendedor</li>
              <li>• Evolución diaria de ventas</li>
              <li>• Productos más vendidos</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">💰 Reporte de Gastos incluye:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Detalle de todos los gastos</li>
              <li>• Resumen por método de pago</li>
              <li>• Estadísticas por usuario</li>
              <li>• Clasificación por concepto</li>
              <li>• Totales por sucursal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}