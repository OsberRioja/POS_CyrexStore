import { useState, useEffect } from 'react';
import { CommissionReportService } from '../services/commissionReportService';
import type { CommissionReport, CommissionSummary } from '../types/commissionReport';

// Componente de carga
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Componente para la pestaña de resumen (con mejor manejo de errores)
function SummaryTab({ summary }: { summary: CommissionSummary[] }) {
  // Verificar que summary sea un array válido
  if (!Array.isArray(summary)) {
    console.error('SummaryTab: summary no es un array:', summary);
    return (
      <div className="bg-white p-6 rounded-lg shadow border text-center text-red-500">
        Error: Los datos de resumen no son válidos.
      </div>
    );
  }

  if (summary.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border text-center text-gray-500">
        No hay datos de comisiones para el período seleccionado.
      </div>
    );
  }

  // Validar que cada item tenga las propiedades necesarias
  const validSummary = summary.filter(item => 
    item && 
    typeof item.totalCommissions === 'number' && 
    typeof item.totalSales === 'number'
  );

  if (validSummary.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border text-center text-yellow-500">
        Los datos existen pero no tienen el formato esperado.
      </div>
    );
  }

  const totalCommissions = validSummary.reduce((sum, item) => sum + (item.totalCommissions || 0), 0);
  const totalSales = validSummary.reduce((sum, item) => sum + (item.totalSales || 0), 0);

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vendedor
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Código
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ventas con Comisión
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Comisiones (Bs)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {validSummary.map((item) => (
            <tr key={item.userId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {item.userName || 'N/A'}
                </div>
                <div className="text-sm text-gray-500">
                  {item.email || 'N/A'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.userCode || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.totalSales || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {(item.totalCommissions || 0).toFixed(2)} Bs
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={2} className="px-6 py-3 text-sm font-medium text-gray-900">
              Totales
            </td>
            <td className="px-6 py-3 text-sm font-medium text-gray-900">{totalSales}</td>
            <td className="px-6 py-3 text-sm font-medium text-gray-900">
              {totalCommissions.toFixed(2)} Bs
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// Componente para la pestaña de detalle (con mejor manejo de errores)
function DetailedTab({ 
  detailed, 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  detailed: CommissionReport[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (!Array.isArray(detailed)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border text-center text-red-500">
        Error: Los datos detallados no son válidos.
      </div>
    );
  }

  if (detailed.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border text-center text-gray-500">
        No hay datos de comisiones detalladas para el período seleccionado.
      </div>
    );
  }

  // Filtrar elementos válidos
  const validDetailed = detailed.filter(item => 
    item && 
    item.id && 
    typeof item.amount === 'number'
  );

  return (
    <div>
      <div className="bg-white rounded-lg shadow border overflow-hidden mb-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Venta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Venta (Bs)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comisión (Bs)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {validDetailed.map((commission) => (
              <tr key={commission.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {commission.user?.name || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {commission.user?.userCode || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {commission.saleId ? commission.saleId.substring(0, 8) + '...' : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {commission.sale?.client?.nombre || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {commission.calculatedAt 
                    ? new Date(commission.calculatedAt).toLocaleDateString() 
                    : 'N/A'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {commission.sale?.total ? commission.sale.total.toFixed(2) : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {(commission.amount || 0).toFixed(2)} Bs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

// Componente principal
export default function CommissionsReportPage() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');
  const [summary, setSummary] = useState<CommissionSummary[]>([]);
  const [detailed, setDetailed] = useState<CommissionReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Cargar reporte al cambiar mes, año o pestaña
  useEffect(() => {
    loadReport();
  }, [selectedMonth, selectedYear, activeTab, currentPage]);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'summary') {
        const response = await CommissionReportService.getSummaryByMonth(selectedMonth, selectedYear);
        console.log('Respuesta del resumen:', response);
        
        // Asegurarnos de que sea un array
        if (response && Array.isArray(response.data)) {
          setSummary(response.data);
        } else if (Array.isArray(response)) {
          // Si la respuesta es directamente el array
          setSummary(response);
        } else {
          console.error('Formato de respuesta inesperado:', response);
          setSummary([]);
        }
      } else {
        const response = await CommissionReportService.getCommissionsByMonth(
          selectedMonth, 
          selectedYear, 
          currentPage, 
          20
        );
        console.log('Respuesta detallada:', response);
        
        if (response && Array.isArray(response.data)) {
          setDetailed(response.data);
          setTotalPages(response.totalPages || 1);
        } else {
          console.error('Formato de respuesta inesperado:', response);
          setDetailed([]);
          setTotalPages(1);
        }
      }
    } catch (error: any) {
      console.error('Error al cargar reporte:', error);
      setError('Error al cargar reporte: ' + (error.message || 'Error desconocido'));
      setSummary([]);
      setDetailed([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleTabChange = (tab: 'summary' | 'detailed') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Generar lista de años (desde 2020 hasta el actual)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📈 Reporte de Comisiones</h1>

      {/* Controles de filtro */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mes</label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={1}>Enero</option>
              <option value={2}>Febrero</option>
              <option value={3}>Marzo</option>
              <option value={4}>Abril</option>
              <option value={5}>Mayo</option>
              <option value={6}>Junio</option>
              <option value={7}>Julio</option>
              <option value={8}>Agosto</option>
              <option value={9}>Septiembre</option>
              <option value={10}>Octubre</option>
              <option value={11}>Noviembre</option>
              <option value={12}>Diciembre</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Año</label>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleTabChange('summary')}
              className={`px-4 py-2 rounded ${
                activeTab === 'summary' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Resumen por Vendedor
            </button>
            <button
              onClick={() => handleTabChange('detailed')}
              className={`px-4 py-2 rounded ${
                activeTab === 'detailed' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Detalle de Comisiones
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : activeTab === 'summary' ? (
        <SummaryTab summary={summary} />
      ) : (
        <DetailedTab 
          detailed={detailed} 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}