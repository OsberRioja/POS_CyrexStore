import { useState } from 'react';
import { useAuth } from '../context/authContext';
//import { useBranch } from '../hooks/useBranch';
import ReportFilters from '../components/reports/ReportFilters';
import { reportService } from '../services/reportService';
import { FileText, Download, BarChart3, CreditCard, Receipt } from 'lucide-react';
import PaginationControls from '../components/PaginationControls';

export default function ReportsPage() {
  const { user } = useAuth();
  //const { currentBranchId } = useBranch();
  const [loading, setLoading] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [activeReport, setActiveReport] = useState<'sales' | 'expenses' | 'combined'>('sales');
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [salesPage, setSalesPage] = useState(1);
  const [salesSellersPage, setSalesSellersPage] = useState(1);
  const [salesProductsPage, setSalesProductsPage] = useState(1);
  const [salesWeekdaysPage, setSalesWeekdaysPage] = useState(1);
  const [expensesConceptsPage, setExpensesConceptsPage] = useState(1);
  const [expensesUsersPage, setExpensesUsersPage] = useState(1);
  const [expensesWeekdaysPage, setExpensesWeekdaysPage] = useState(1);
  const [combinedBranchesPage, setCombinedBranchesPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 10;
  const [filters, setFilters] = useState({
    period: 'month',
    startDate: '',
    endDate: '',
    branchId: user?.branchId ? user.branchId.toString() : '',
    sellerId: '',
    sellerIds: [] as string[],
    paymentMethodId: ''
  });

  // Manejar cambio de filtros
  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPreviewData(null);
    setSalesPage(1);
    setSalesSellersPage(1);
    setSalesProductsPage(1);
    setSalesWeekdaysPage(1);
    setExpensesConceptsPage(1);
    setExpensesUsersPage(1);
    setExpensesWeekdaysPage(1);
    setCombinedBranchesPage(1);
  };

  const handlePreview = async () => {
    if (!filters.startDate || !filters.endDate) {
      setPreviewData(null);
      return;
    }

    setLoadingPreview(true);
    try {
      let preview: any = null;
      if (activeReport === 'sales') {
        preview = await reportService.getPeriodSalesPreview(
          filters.startDate,
          filters.endDate,
          filters.branchId ? parseInt(filters.branchId) : undefined,
          filters.sellerId || undefined,
          filters.paymentMethodId ? parseInt(filters.paymentMethodId) : undefined,
          filters.sellerIds
        );
      } else if (activeReport === 'expenses') {
        preview = await reportService.getPeriodExpensesPreview(
          filters.startDate,
          filters.endDate,
          filters.branchId ? parseInt(filters.branchId) : undefined,
          filters.paymentMethodId ? parseInt(filters.paymentMethodId) : undefined
        );
      } else {
        preview = await reportService.getCombinedPreview(
          filters.startDate,
          filters.endDate,
          filters.branchId ? parseInt(filters.branchId) : undefined,
          filters.sellerId || undefined,
          filters.paymentMethodId ? parseInt(filters.paymentMethodId) : undefined,
          filters.sellerIds
        );
      }
      setPreviewData(preview);
      setSalesPage(1);
      setSalesSellersPage(1);
      setSalesProductsPage(1);
      setSalesWeekdaysPage(1);
      setExpensesConceptsPage(1);
      setExpensesUsersPage(1);
      setExpensesWeekdaysPage(1);
      setCombinedBranchesPage(1);
    } catch (error: any) {
      console.error('Error cargando previsualización:', error);
      alert(error.message || 'Error al previsualizar reporte');
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
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
            filters.paymentMethodId ? parseInt(filters.paymentMethodId) : undefined,
            filters.sellerIds
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
                onClick={() => {
                  setActiveReport(report.id as any);
                  setPreviewData(null);
                  setSalesPage(1);
                  setSalesSellersPage(1);
                  setSalesProductsPage(1);
                  setSalesWeekdaysPage(1);
                  setExpensesConceptsPage(1);
                  setExpensesUsersPage(1);
                  setExpensesWeekdaysPage(1);
                  setCombinedBranchesPage(1);
                }}
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
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={loadingPreview || !filters.startDate || !filters.endDate}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPreview ? 'Generando Vista...' : 'Previsualizar Filtros'}
            </button>
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
      </div>

      {activeReport === 'sales' && previewData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Previsualización de Resultados</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-600">Ventas</p><p className="font-bold">{previewData.summary.totalSales}</p></div>
            <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs text-gray-600">Monto Total</p><p className="font-bold">Bs. {previewData.summary.totalAmount.toFixed(2)}</p></div>
            <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-xs text-gray-600">Pagado</p><p className="font-bold">Bs. {previewData.summary.totalPaid.toFixed(2)}</p></div>
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-600">Saldo</p><p className="font-bold">Bs. {previewData.summary.totalBalance.toFixed(2)}</p></div>
            <div className="p-3 bg-purple-50 rounded-lg"><p className="text-xs text-gray-600">Ticket Prom.</p><p className="font-bold">Bs. {previewData.summary.averageTicket.toFixed(2)}</p></div>
            <div className="p-3 bg-cyan-50 rounded-lg"><p className="text-xs text-gray-600">Unidades</p><p className="font-bold">{previewData.summary.totalUnits}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Ranking vendedores</h4>
              <ul className="text-sm space-y-1">
                {(previewData.rankings.sellers || [])
                  .slice((salesSellersPage - 1) * PREVIEW_PAGE_SIZE, salesSellersPage * PREVIEW_PAGE_SIZE)
                  .map((s: any, idx: number) => (
                  <li key={`${s.sellerId}-${idx}`} className="flex justify-between border-b pb-1">
                    <span>{(salesSellersPage - 1) * PREVIEW_PAGE_SIZE + idx + 1}. {s.sellerName} <span className="text-xs text-gray-500">({s.branchName})</span></span>
                    <span className="font-medium">Bs. {s.totalAmount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <PaginationControls
                currentPage={salesSellersPage}
                totalPages={Math.max(1, Math.ceil((previewData.rankings.sellers || []).length / PREVIEW_PAGE_SIZE))}
                totalItems={(previewData.rankings.sellers || []).length}
                pageSize={PREVIEW_PAGE_SIZE}
                onPageChange={setSalesSellersPage}
              />
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Ranking productos</h4>
              <ul className="text-sm space-y-1">
                {(previewData.rankings.products || [])
                  .slice((salesProductsPage - 1) * PREVIEW_PAGE_SIZE, salesProductsPage * PREVIEW_PAGE_SIZE)
                  .map((p: any, idx: number) => (
                  <li key={`${p.productId}-${idx}`} className="flex justify-between border-b pb-1">
                    <span>{(salesProductsPage - 1) * PREVIEW_PAGE_SIZE + idx + 1}. {p.productName}</span>
                    <span className="font-medium">{p.quantity} u</span>
                  </li>
                ))}
              </ul>
              <PaginationControls
                currentPage={salesProductsPage}
                totalPages={Math.max(1, Math.ceil((previewData.rankings.products || []).length / PREVIEW_PAGE_SIZE))}
                totalItems={(previewData.rankings.products || []).length}
                pageSize={PREVIEW_PAGE_SIZE}
                onPageChange={setSalesProductsPage}
              />
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Ranking días de semana</h4>
              <ul className="text-sm space-y-1">
                {(previewData.rankings.weekdays || [])
                  .slice((salesWeekdaysPage - 1) * PREVIEW_PAGE_SIZE, salesWeekdaysPage * PREVIEW_PAGE_SIZE)
                  .map((d: any, idx: number) => (
                  <li key={`${d.day}-${idx}`} className="flex justify-between border-b pb-1">
                    <span>{(salesWeekdaysPage - 1) * PREVIEW_PAGE_SIZE + idx + 1}. {d.day}</span>
                    <span className="font-medium">Bs. {d.totalAmount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <PaginationControls
                currentPage={salesWeekdaysPage}
                totalPages={Math.max(1, Math.ceil((previewData.rankings.weekdays || []).length / PREVIEW_PAGE_SIZE))}
                totalItems={(previewData.rankings.weekdays || []).length}
                pageSize={PREVIEW_PAGE_SIZE}
                onPageChange={setSalesWeekdaysPage}
              />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Primeras ventas filtradas</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left p-2">Fecha</th>
                    <th className="text-left p-2">Sucursal</th>
                    <th className="text-left p-2">Vendedor</th>
                    <th className="text-left p-2">Cliente</th>
                    <th className="text-right p-2">Total</th>
                    <th className="text-right p-2">Pagado</th>
                    <th className="text-right p-2">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {(previewData.previewSales || [])
                    .slice((salesPage - 1) * PREVIEW_PAGE_SIZE, salesPage * PREVIEW_PAGE_SIZE)
                    .map((sale: any) => (
                    <tr key={sale.id} className="border-b">
                      <td className="p-2">{new Date(sale.createdAt).toLocaleString('es-BO')}</td>
                      <td className="p-2">{sale.branchName}</td>
                      <td className="p-2">{sale.sellerName}</td>
                      <td className="p-2">{sale.clientName}</td>
                      <td className="p-2 text-right">Bs. {sale.total.toFixed(2)}</td>
                      <td className="p-2 text-right">Bs. {sale.paid.toFixed(2)}</td>
                      <td className="p-2 text-right">Bs. {sale.balance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={salesPage}
              totalPages={Math.max(1, Math.ceil((previewData.previewSales || []).length / PREVIEW_PAGE_SIZE))}
              totalItems={(previewData.previewSales || []).length}
              pageSize={PREVIEW_PAGE_SIZE}
              onPageChange={setSalesPage}
            />
          </div>
        </div>
      )}

      {activeReport === 'expenses' && previewData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Previsualización de Gastos (Top 15)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-600">Cantidad Gastos</p><p className="font-bold">{previewData.summary.totalExpenses}</p></div>
            <div className="p-3 bg-orange-50 rounded-lg"><p className="text-xs text-gray-600">Monto Total</p><p className="font-bold">Bs. {previewData.summary.totalAmount.toFixed(2)}</p></div>
            <div className="p-3 bg-amber-50 rounded-lg"><p className="text-xs text-gray-600">Gasto Promedio</p><p className="font-bold">Bs. {previewData.summary.averageExpense.toFixed(2)}</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Ranking por concepto</h4>
              <ul className="text-sm space-y-1">
                {(previewData.rankings.concepts || [])
                  .slice((expensesConceptsPage - 1) * PREVIEW_PAGE_SIZE, expensesConceptsPage * PREVIEW_PAGE_SIZE)
                  .map((c: any, idx: number) => (
                  <li key={`${c.concept}-${idx}`} className="flex justify-between border-b pb-1">
                    <span>{(expensesConceptsPage - 1) * PREVIEW_PAGE_SIZE + idx + 1}. {c.concept}</span><span className="font-medium">Bs. {c.totalAmount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <PaginationControls
                currentPage={expensesConceptsPage}
                totalPages={Math.max(1, Math.ceil((previewData.rankings.concepts || []).length / PREVIEW_PAGE_SIZE))}
                totalItems={(previewData.rankings.concepts || []).length}
                pageSize={PREVIEW_PAGE_SIZE}
                onPageChange={setExpensesConceptsPage}
              />
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Ranking por usuario</h4>
              <ul className="text-sm space-y-1">
                {(previewData.rankings.users || [])
                  .slice((expensesUsersPage - 1) * PREVIEW_PAGE_SIZE, expensesUsersPage * PREVIEW_PAGE_SIZE)
                  .map((u: any, idx: number) => (
                  <li key={`${u.userId}-${idx}`} className="flex justify-between border-b pb-1">
                    <span>{(expensesUsersPage - 1) * PREVIEW_PAGE_SIZE + idx + 1}. {u.userName}</span><span className="font-medium">Bs. {u.totalAmount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <PaginationControls
                currentPage={expensesUsersPage}
                totalPages={Math.max(1, Math.ceil((previewData.rankings.users || []).length / PREVIEW_PAGE_SIZE))}
                totalItems={(previewData.rankings.users || []).length}
                pageSize={PREVIEW_PAGE_SIZE}
                onPageChange={setExpensesUsersPage}
              />
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Ranking por día de semana</h4>
              <ul className="text-sm space-y-1">
                {(previewData.rankings.weekdays || [])
                  .slice((expensesWeekdaysPage - 1) * PREVIEW_PAGE_SIZE, expensesWeekdaysPage * PREVIEW_PAGE_SIZE)
                  .map((d: any, idx: number) => (
                  <li key={`${d.day}-${idx}`} className="flex justify-between border-b pb-1">
                    <span>{(expensesWeekdaysPage - 1) * PREVIEW_PAGE_SIZE + idx + 1}. {d.day}</span><span className="font-medium">Bs. {d.totalAmount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <PaginationControls
                currentPage={expensesWeekdaysPage}
                totalPages={Math.max(1, Math.ceil((previewData.rankings.weekdays || []).length / PREVIEW_PAGE_SIZE))}
                totalItems={(previewData.rankings.weekdays || []).length}
                pageSize={PREVIEW_PAGE_SIZE}
                onPageChange={setExpensesWeekdaysPage}
              />
            </div>
          </div>
        </div>
      )}

      {activeReport === 'combined' && previewData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Previsualización Combinada</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs text-gray-600">Ventas</p><p className="font-bold">Bs. {previewData.summary.totalSalesAmount.toFixed(2)}</p></div>
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-gray-600">Gastos</p><p className="font-bold">Bs. {previewData.summary.totalExpensesAmount.toFixed(2)}</p></div>
            <div className="p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-600">Neto</p><p className="font-bold">Bs. {previewData.summary.netIncome.toFixed(2)}</p></div>
            <div className="p-3 bg-purple-50 rounded-lg"><p className="text-xs text-gray-600">Margen</p><p className="font-bold">{previewData.summary.margin.toFixed(2)}%</p></div>
            <div className="p-3 bg-cyan-50 rounded-lg"><p className="text-xs text-gray-600"># Ventas</p><p className="font-bold">{previewData.summary.totalSalesCount}</p></div>
            <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-xs text-gray-600"># Gastos</p><p className="font-bold">{previewData.summary.totalExpensesCount}</p></div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Rentabilidad por sucursal</h4>
            <ul className="text-sm space-y-1">
              {(previewData.rankings.branchProfitability || [])
                .slice((combinedBranchesPage - 1) * PREVIEW_PAGE_SIZE, combinedBranchesPage * PREVIEW_PAGE_SIZE)
                .map((b: any, idx: number) => (
                <li key={`${b.branchName}-${idx}`} className="flex justify-between border-b pb-1">
                  <span>{(combinedBranchesPage - 1) * PREVIEW_PAGE_SIZE + idx + 1}. {b.branchName}</span>
                  <span className="font-medium">Neto Bs. {b.net.toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <PaginationControls
              currentPage={combinedBranchesPage}
              totalPages={Math.max(1, Math.ceil((previewData.rankings.branchProfitability || []).length / PREVIEW_PAGE_SIZE))}
              totalItems={(previewData.rankings.branchProfitability || []).length}
              pageSize={PREVIEW_PAGE_SIZE}
              onPageChange={setCombinedBranchesPage}
            />
          </div>
        </div>
      )}

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
