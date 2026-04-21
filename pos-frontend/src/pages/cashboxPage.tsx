import { useEffect, useState } from "react";
import { cashboxService } from "../services/cashboxService";
import { saleService } from "../services/saleService";
import { expenseService } from "../services/expenseService";
import OpenCashboxModal from "../components/openBoxModal";
import { useAuth } from "../context/authContext";
import SalesPage from "./salesPage";
import ExpensesPage from "./expensesPage";
import PaymentMethodsPage from "./paymentMethodPage";
import CloseCashModal from "../components/CloseCashModal";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { PermissionGuard } from "../components/PermissionGuard";
import CashboxReportModal from "../components/CashboxReportModal";
import { ReopenCashboxModal } from "../components/ReopenCashboxModal";
import { EditSaleModal } from "../components/EditSaleModal";
import { EditExpenseModal } from "../components/EditExpenseModal";
import { useDialog } from "../context/DialogContext";

export default function CashboxPage() {
  const { token } = useAuth();
  const _token = token ?? undefined;

  const [openCashbox, setOpenCashbox] = useState<any | null>(null);
  const [selectedCashbox, setSelectedCashbox] = useState<any | null>(null);
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [totalCashboxes, setTotalCashboxes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [view, setView] = useState<"ventas" | "gastos" | "paymentMethods" | "history" | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeData, setCloseData] = useState<any>(null);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [cashboxToReopen, setCashboxToReopen] = useState<any | null>(null);
  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<any | null>(null);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [selectedExpenseForEdit, setSelectedExpenseForEdit] = useState<any | null>(null);

  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 10;

  const { hasPermission } = usePermissions();
  const { alert, confirm } = useDialog();
 
  useEffect(() => {
    loadAll();
  }, [_token, historyPage, showAllHistory]);
  
  async function loadSales(cashBoxId: number) {
    try {
      const r = await saleService.list({cashBoxId});
      setSales(Array.isArray(r?.data) ? r.data : []);
    } catch {
      console.error("Error loading sales for cash box", cashBoxId);
      setSales([]);
    }
  }

  async function loadExpenses(boxId: number) {
    try {
      const r = await expenseService.listByBox(boxId);
      setExpenses(Array.isArray(r?.data) ? r.data : []);
    } catch {
      setExpenses([]);
    }
  }

  async function loadAll() {
    setLoading(true);
    try {
      console.log('🔍 [1] Loading open cashbox...');
      const rOpen = await cashboxService.getOpen();
      console.log('🔍 [1] Open cashbox response:', rOpen);
      const open = rOpen?.data ?? null;
      setOpenCashbox(open);
      if (open?.id) {
        await Promise.all([loadSales(open.id), loadExpenses(open.id)]);
      } else {
        setSales([]);
        setExpenses([]);
      }
    } catch(error) {
      console.error('❌ Error loading open cashbox:', error);
      setOpenCashbox(null);
    }
    
    // Cargar historial de cajas
    try {
      if(hasPermission(Permission.CASHBOX_READ)) {
        const params: any = {
          page: historyPage,
          limit: showAllHistory ? HISTORY_PER_PAGE : 5
        };
        
        const rList = await cashboxService.list(params);
        const data = rList.data;
        
        if (data && data.data) {
          setCashboxes(Array.isArray(data.data) ? data.data : []);
          setTotalCashboxes(data.total || 0);
        } else {
          setCashboxes([]);
          setTotalCashboxes(0);
        }
      } else {
        setCashboxes([]);
        setTotalCashboxes(0);
      }
    } catch(error) {
      console.error('❌ Error loading cashbox history:', error);
      setCashboxes([]);
      setTotalCashboxes(0);
    } finally {
      setLoading(false);
    }
  }

  const shouldShowReopenButton = (box: any) => {
    if (!hasPermission(Permission.CASHBOX_REOPEN)) return false;
    if (box.status !== 'CLOSED') return false;
    
    // Verificar si hay caja abierta en la MISMA sucursal
    if (openCashbox && openCashbox.branchId === box.branchId) {
      return false; // No mostrar si hay caja abierta en la misma sucursal
    }
    
    return true;
  };

  const handleViewDetails = async (box: any) => {
    setSelectedCashbox(box);
    setView("ventas"); // Comenzar mostrando ventas
    try {
      // Cargar datos completos de la caja
      const cashboxDetails = await cashboxService.getById(box.id);
      setSelectedCashbox(cashboxDetails.data || cashboxDetails);
      
      await Promise.all([
        loadSales(box.id),
        loadExpenses(box.id)
      ]);
    } catch (error) {
      console.error("Error loading cashbox details:", error);
    }
  };

  const handleCloseDetails = () => {
    setSelectedCashbox(null);
    setView(null);
    setSales([]);
    setExpenses([]);
  };

  const handleCloseCashbox = async () => {
    if (!openCashbox?.id) {
      alert("No hay caja abierta.", 'warning');
      return;
    }

    const shouldClose = await confirm({
      title: 'Cerrar caja',
      message: '¿Cerrar caja ahora?',
      confirmText: 'Cerrar caja',
      danger: true,
    });
    if (!shouldClose) return;
    try {
    setLoading(true);
    const response = await cashboxService.getClosePreview(openCashbox.id);
    setCloseData(response.data);
    setShowCloseModal(true);
  } catch (error) {
    console.error('Error getting close preview:', error);
    alert('Error al obtener datos de cierre', 'error');
  } finally {
    setLoading(false);
  }
  };

  const handleConfirmClose = async (data: { cashCount: any; notes?: string }) => {
    try {
      await cashboxService.close(openCashbox.id, {
        realClosedAmount: data.cashCount.total,
        observations: data.notes,
        cashCount: data.cashCount
      });

      setShowCloseModal(false);
      setCloseData(null);
      await loadAll();
    } catch (error) {
      console.error('Error closing cashbox:', error);
      throw error;
    }
  };
  const handleReopenCashbox = (cashbox: any) => {
    setCashboxToReopen(cashbox);
    setShowReopenModal(true);
  };

  // Función para manejar edición de venta
  const handleEditSale = (sale: any) => {
    console.log('🛠️ handleEditSale called:', {
    saleId: sale?.id,
    saleCashBoxId: sale?.cashBoxId,
    activeCashbox: selectedCashbox || openCashbox,
    activeCashboxStatus: (selectedCashbox || openCashbox)?.status,
    hasSelectedSale: !!selectedSaleForEdit,
    showModal: showEditSaleModal
  });
    const activeCashbox = selectedCashbox || openCashbox;
    
    if (!activeCashbox) {
      alert('No hay caja activa', 'warning');
      return;
    }

    // Permitir edición en cajas OPEN y REOPENED
    if (activeCashbox.status !== 'OPEN' && activeCashbox.status !== 'REOPENED') {
      alert('Solo se pueden editar ventas en cajas abiertas', 'warning');
      return;
    }

    // Verificar que la venta pertenezca a esta caja
    if (sale.cashBoxId !== activeCashbox.id) {
      alert('Esta venta no pertenece a esta caja', 'warning');
      return;
    }

    setSelectedSaleForEdit(sale);
    setShowEditSaleModal(true);
  };

  // Función para editar gastos
  const handleEditExpense = (expense: any) => {
    console.log('🛠️ handleEditExpense called:', {
    expenseId: expense?.id,
    expenseCashBoxId: expense?.cashBoxId,
    activeCashbox: selectedCashbox || openCashbox,
    activeCashboxStatus: (selectedCashbox || openCashbox)?.status,
    hasSelectedExpense: !!selectedExpenseForEdit,
    showModal: showEditExpenseModal
  });
    const activeCashbox = selectedCashbox || openCashbox;
    
    if (!activeCashbox) {
      alert('No hay caja activa', 'warning');
      return;
    }

    // Permitir edición en cajas OPEN y REOPENED
    if (activeCashbox.status !== 'OPEN' && activeCashbox.status !== 'REOPENED') {
      alert('Solo se pueden editar gastos en cajas abiertas', 'warning');
      return;
    }

    setSelectedExpenseForEdit(expense);
    setShowEditExpenseModal(true);
  };


  const handleCloseReopened = async () => {
    if (!openCashbox?.id) return;
    
    // Confirmación especial para cajas reabiertas
    const confirmMessage = `¿Cerrar caja reabierta #${openCashbox.id}?\n\nIMPORTANTE:\n• No se volverá a contar el efectivo\n• Se mantendrá el monto real original (Bs. ${openCashbox.realClosedAmount?.toFixed(2) || openCashbox.closedAmount?.toFixed(2)})\n• Solo se actualizarán los totales de ventas y gastos`;
    
    const shouldCloseReopened = await confirm({
      title: `Cerrar caja reabierta #${openCashbox.id}`,
      message: confirmMessage,
      confirmText: 'Cerrar reabierta',
      danger: true,
    });
    if (!shouldCloseReopened) return;
    
    try {
      setLoading(true);
      await cashboxService.closeReopened(openCashbox.id);
      await loadAll();
    } catch (error: any) {
      console.error('Error closing reopened cashbox:', error);
      alert(error.response?.data?.error || 'Error al cerrar caja reabierta', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando caja...</div>;

  const cashboxActionBase =
    'h-11 min-w-[140px] rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1';
  const cashboxPrimary = `${cashboxActionBase} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  const cashboxPrimarySoft = `${cashboxActionBase} bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 focus:ring-blue-400`;
  const cashboxDanger = `${cashboxActionBase} bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500`;
  const cashboxWarning = `${cashboxActionBase} bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500`;
  const cashboxNeutral = `${cashboxActionBase} bg-slate-200 text-slate-700 hover:bg-slate-300 focus:ring-slate-400`;


  const TableHistorialCajas = ({ 
    boxes, 
    onViewDetails, 
    onReopen,
    showReopen = true,
    compact = false 
  }: { 
    boxes: any[], 
    onViewDetails: (box: any) => void, 
    onReopen: (box: any) => void,
    showReopen: boolean,
    compact: boolean 
  }) => {
    // Función para formatear números
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('es-BO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num || 0);
    };

    // Función para determinar el color de la ganancia
    const getProfitColor = (profit: number) => {
      if (profit > 0) return 'text-green-600';
      if (profit < 0) return 'text-red-600';
      return 'text-gray-600';
    };

    // Estructura base para vista compacta
    if (compact) {
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Encabezados */}
          <div className="grid grid-cols-7 bg-gray-50 px-3 py-2">
            <div className="text-xs font-medium text-gray-500 uppercase">ID</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Abierta</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Ventas</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Gastos</div>
            <div className="text-xs font-medium text-gray-500 uppercase text-right">Ganancia</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Estado</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Acciones</div>
          </div>
          
          {/* Filas */}
          <div className="divide-y divide-gray-200">
            {boxes.map((box: any) => {
              const totals = box.simpleTotals || {
                totalSales: 0,
                totalExpenses: 0,
                simpleGrossProfit: 0
              };
              
              const salesCount = box._count?.sales || 0;
              const expensesCount = box._count?.expenses || 0;
              
              return (
                <div key={box.id} className="grid grid-cols-7 px-3 py-3 hover:bg-gray-50 items-center">
                  {/* ID */}
                  <div className="text-sm font-medium">#{box.id}</div>
                  
                  {/* FECHA */}
                  <div>
                    <div className="text-sm">
                      {new Date(box.openedAt).toLocaleDateString('es-BO')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(box.openedAt).toLocaleTimeString('es-BO', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  
                  {/* VENTAS */}
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      Bs. {formatNumber(totals.totalSales)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {salesCount > 0 ? `${salesCount} venta${salesCount !== 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                  
                  {/* GASTOS */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      Bs. {formatNumber(totals.totalExpenses)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {expensesCount > 0 ? `${expensesCount} gasto${expensesCount !== 1 ? 's' : ''}` : ''}
                    </div>
                  </div>
                  
                  {/* GANANCIA */}
                  <div className="text-right">
                    <div className={`text-sm font-bold ${getProfitColor(totals.simpleGrossProfit)}`}>
                      Bs. {formatNumber(totals.simpleGrossProfit)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {totals.totalSales > 0 ? 
                        `${((totals.simpleGrossProfit / totals.totalSales) * 100).toFixed(1)}%` : ''}
                    </div>
                  </div>
                      
                  {/* ESTADO */}
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                      box.status === 'OPEN' 
                        ? 'bg-green-100 text-green-800' 
                        : box.status === 'REOPENED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {box.status === 'OPEN' ? 'Abierta' : 
                       box.status === 'REOPENED' ? 'Reabierta' : 'Cerrada'}
                    </span>
                  </div>
                      
                  {/* ACCIONES */}
                  <div className="flex flex-col gap-1">
                    {showReopen && shouldShowReopenButton(box) && (
                      <button
                        onClick={() => onReopen(box)}
                        className={`px-2 py-1 rounded text-xs ${
                          openCashbox && openCashbox.branchId === box.branchId
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                        disabled={openCashbox && openCashbox.branchId === box.branchId}
                      >
                        Reabrir
                      </button>
                    )}
                    <button
                      onClick={() => onViewDetails(box)}
                      className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // Vista detallada (para showAllHistory = true)
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[8%]">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Abierta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Cerrada</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Inicial</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Final</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Ventas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[12%]">Gastos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[13%]">G. Bruta</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {boxes.map((box: any) => {
              // Usar simpleTotals para cálculo correcto (ventas - gastos)
              const totals = box.simpleTotals || {
                totalSales: 0,
                totalExpenses: 0,
                simpleGrossProfit: 0
              };

              const salesCount = box._count?.sales || 0;
              const expensesCount = box._count?.expenses || 0;

              return (
                <tr key={box.id} className="hover:bg-gray-50">
                  {/* ID */}
                  <td className="px-4 py-3 text-sm font-medium align-top">
                    #{box.id}
                  </td>

                  {/* FECHA APERTURA */}
                  <td className="px-4 py-3 text-sm align-top">
                    <div className="whitespace-nowrap">
                      {new Date(box.openedAt).toLocaleDateString('es-BO')}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(box.openedAt).toLocaleTimeString('es-BO', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </td>

                  {/* FECHA CIERRE */}
                  <td className="px-4 py-3 text-sm align-top">
                    {box.closedAt ? (
                      <>
                        <div className="whitespace-nowrap">
                          {new Date(box.closedAt).toLocaleDateString('es-BO')}
                        </div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {new Date(box.closedAt).toLocaleTimeString('es-BO', {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* MONTO INICIAL */}
                  <td className="px-4 py-3 text-sm align-top">
                    <div className="font-medium">Bs. {box.initialAmount.toFixed(2)}</div>
                  </td>
                  
                  {/* MONTO FINAL */}
                  <td className="px-4 py-3 text-sm align-top">
                    {box.closedAmount ? (
                      <div className="font-medium">Bs. {box.closedAmount.toFixed(2)}</div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  
                  {/* VENTAS */}
                  <td className="px-4 py-3 text-sm text-right align-top">
                    <div className="font-medium">Bs. {formatNumber(totals.totalSales)}</div>
                    {salesCount > 0 && (
                      <div className="text-xs text-gray-500">{salesCount} venta{salesCount !== 1 ? 's' : ''}</div>
                    )}
                  </td>
                  
                  {/* GASTOS */}
                  <td className="px-4 py-3 text-sm text-right align-top">
                    <div className="font-medium text-red-600">Bs. {formatNumber(totals.totalExpenses)}</div>
                    {expensesCount > 0 && (
                      <div className="text-xs text-gray-500">{expensesCount} gasto{expensesCount !== 1 ? 's' : ''}</div>
                    )}
                  </td>
                  
                  {/* GANANCIA BRUTA (ventas - gastos) */}
                  <td className="px-4 py-3 text-sm text-right align-top">
                    <div className={`font-bold ${getProfitColor(totals.simpleGrossProfit)}`}>
                      Bs. {formatNumber(totals.simpleGrossProfit)}
                    </div>
                    {totals.totalSales > 0 && (
                      <div className="text-xs text-gray-500">
                        {((totals.simpleGrossProfit / totals.totalSales) * 100).toFixed(1)}%
                      </div>
                    )}
                  </td>
                  
                  {/* ESTADO */}
                  <td className="px-4 py-3 align-top">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                      box.status === 'OPEN' 
                        ? 'bg-green-100 text-green-800' 
                        : box.status === 'REOPENED'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {box.status === 'OPEN' ? 'Abierta' : 
                       box.status === 'REOPENED' ? 'Reabierta' : 'Cerrada'}
                    </span>
                  </td>
                      
                  {/* ACCIONES */}
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-col gap-2">
                      {showReopen && shouldShowReopenButton(box) && (
                        <button
                          onClick={() => onReopen(box)}
                          className={`px-3 py-1 rounded text-sm ${
                            openCashbox && openCashbox.branchId === box.branchId
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          }`}
                          disabled={openCashbox && openCashbox.branchId === box.branchId}
                          title={openCashbox && openCashbox.branchId === box.branchId 
                            ? `Hay una caja abierta en ${box.branch?.name || 'esta sucursal'}. Cierre la caja actual para reabrir.` 
                            : "Reabrir caja"}
                        >
                          Reabrir
                        </button>
                      )}
                      <button
                        onClick={() => onViewDetails(box)}
                        className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (selectedCashbox) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Detalles de Caja #{selectedCashbox.id}</h1>
            <p className="text-sm text-gray-600">Modo solo lectura</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setView("ventas")} 
              className={view === 'ventas' ? cashboxPrimary : cashboxPrimarySoft}
            >
              Ventas
            </button>
            <button 
              onClick={() => setView("gastos")} 
              className={view === 'gastos' ? cashboxPrimary : cashboxPrimarySoft}
            >
              Gastos
            </button>
            <button 
              onClick={() => setView("paymentMethods")} 
              className={view === 'paymentMethods' ? cashboxPrimary : cashboxPrimarySoft}
            >
              Métodos de pago
            </button>
            <button 
              onClick={handleCloseDetails} 
              className={cashboxNeutral}
            >
              Volver
            </button>
          </div>
        </div>

        {/* INFORMACIÓN DE CAJA */}
        <div className="mb-4 p-4 rounded-lg border bg-white shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="font-semibold text-lg">
              Caja #{selectedCashbox.id} - 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                selectedCashbox.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                selectedCashbox.status === 'REOPENED' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedCashbox.status === 'REOPENED' ? 'REABIERTA' : selectedCashbox.status}
              </span>
            </div>
            
            {/* Botones para cajas reabiertas */}
            {selectedCashbox.status === 'REOPENED' && (
              <div className="flex gap-2">
                <button
                  onClick={handleCloseReopened}  // Usar la nueva función
                  className={cashboxWarning}
                >
                  Cerrar Reapertura
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className={cashboxPrimary}
                >
                  📊 Ver Reporte
                </button>
              </div>
            )}
            {/* Botón para ver reporte completo - SOLO si la caja está cerrada (no reabierta) */}
            {selectedCashbox.status === 'CLOSED' && (
              <button
                onClick={() => {
                  setShowReportModal(true);
                }}
                className={cashboxPrimary}
              >
                📊 Ver Reporte Completo
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Abierta</p>
              <p className="font-medium">{new Date(selectedCashbox.openedAt).toLocaleString('es-BO')}</p>
            </div>
            <div>
              <p className="text-gray-600">Cerrada</p>
              <p className="font-medium">
                {selectedCashbox.closedAt ? new Date(selectedCashbox.closedAt).toLocaleString('es-BO') : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Monto Inicial</p>
              <p className="font-medium">Bs. {selectedCashbox.initialAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-600">Monto Real de Cierre</p>
              <p className="font-medium text-lg font-semibold">
                {selectedCashbox.realClosedAmount 
                  ? `Bs. ${selectedCashbox.realClosedAmount.toFixed(2)}`
                  : selectedCashbox.closedAmount 
                    ? `Bs. ${selectedCashbox.closedAmount.toFixed(2)}` 
                    : '-'
                }
              </p>
              {/* Mostrar diferencia si existe */}
              {selectedCashbox.difference !== null && selectedCashbox.difference !== undefined && (
                <p className={`text-xs ${
                  selectedCashbox.difference === 0 ? 'text-green-600' :
                  selectedCashbox.difference > 0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {selectedCashbox.difference === 0 
                    ? '✓ Cuadre exacto' 
                    : selectedCashbox.difference > 0 
                      ? `▲ Excedente: Bs. ${Math.abs(selectedCashbox.difference).toFixed(2)}`
                      : `▼ Faltante: Bs. ${Math.abs(selectedCashbox.difference).toFixed(2)}`
                  }
                </p>
              )}
            </div>
          </div>

          {/* Información de usuarios */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 border-t pt-3">
            <div>
              <span className="font-medium">Abierta por:</span> {selectedCashbox.openedByUser?.name} 
              {selectedCashbox.openedByUser?.userCode && ` (#${selectedCashbox.openedByUser.userCode})`}
            </div>
            {selectedCashbox.closedByUser && (
              <div>
                <span className="font-medium">Cerrada por:</span> {selectedCashbox.closedByUser.name}
                {selectedCashbox.closedByUser.userCode && ` (#${selectedCashbox.closedByUser.userCode})`}
              </div>
            )}
            {selectedCashbox.reopenedByUser && (
              <div>
                <span className="font-medium">Reabierta por:</span> {selectedCashbox.reopenedByUser.name}
                {selectedCashbox.reopenedByUser.userCode && ` (#${selectedCashbox.reopenedByUser.userCode})`}
              </div>
            )}
          </div>
        </div>

        {view === "ventas" && selectedCashbox && (
          <div>
            <SalesPage
              sales={sales || []}
              onReload={() => loadSales(selectedCashbox.id)}
              openCashboxId={undefined} // null = no se puede agregar ventas
              token={_token}
              isClosedCashbox={true}
              cashboxId={selectedCashbox.id}
              onEditSale={handleEditSale}
            />
          </div>
        )}

        {view === "gastos" && selectedCashbox && (
          <ExpensesPage
            expenses={expenses}
            onReload={() => loadExpenses(selectedCashbox.id)}
            openCashboxId={undefined} // null = no se puede agregar gastos
            token={_token}
            isClosedCashbox={true}
            cashboxId={selectedCashbox.id}
            onEditExpense={selectedCashbox?.status === 'REOPENED' ? handleEditExpense : undefined}
            isReopened={selectedCashbox?.status === 'REOPENED'}
          />
        )}

        {view === "paymentMethods" && (
          <PaymentMethodsPage
            cashBoxId={selectedCashbox.id}
            onBack={() => setView(null)}
            isClosedCashbox={true}
          />
        )}

        {showReportModal && (
          <CashboxReportModal
            cashbox={selectedCashbox}
            onClose={() => {
              console.log('🔍 [REPORT MODAL] Cerrando modal');
              setShowReportModal(false);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* CABECERA CON BOTONES COHERENTES */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Caja</h1>
          {openCashbox && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              openCashbox.status === 'REOPENED' 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                : 'bg-green-100 text-green-800 border border-green-300'
            }`}>
              {openCashbox.status === 'REOPENED' ? '🔄 REABIERTA' : '✅ ABIERTA'}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Botones siempre visibles para caja abierta */}
          {openCashbox && (
            <>
              <button onClick={() => setView("ventas")} 
                className={view === 'ventas' ? cashboxPrimary : cashboxPrimarySoft}>
                Ventas
              </button>
              <button onClick={() => setView("gastos")} 
                className={view === 'gastos' ? cashboxPrimary : cashboxPrimarySoft}>
                Gastos
              </button>
              <button onClick={() => setView("paymentMethods")} 
                className={view === 'paymentMethods' ? cashboxPrimary : cashboxPrimarySoft}>
                Métodos de Pago
              </button>
              
              <PermissionGuard permission={Permission.CASHBOX_OPEN_CLOSE}>
                {openCashbox.status === 'OPEN' && (
                  <button onClick={handleCloseCashbox} 
                    className={cashboxDanger}>
                    Cerrar Caja
                  </button>
                )}
                {openCashbox.status === 'REOPENED' && (
                  <button onClick={handleCloseReopened} 
                    className={cashboxWarning}>
                    Finalizar Reapertura
                  </button>
                )}
              </PermissionGuard>
            </>
          )}
          
          {/* Botón para abrir caja (solo si no hay abierta) */}
          <PermissionGuard permission={Permission.CASHBOX_OPEN_CLOSE}>
            {!openCashbox && (
              <button onClick={() => setShowOpenModal(true)}
                className={cashboxPrimary}>
                + Abrir Caja
              </button>
            )}
          </PermissionGuard>
          
          {/* Botón HISTORIAL siempre visible */}
          <PermissionGuard permission={Permission.CASHBOX_READ}>
            <button 
              onClick={() => {
                if (showAllHistory) {
                  setShowAllHistory(false);
                  setView(null);
                } else {
                  setShowAllHistory(true);
                  setView(null);
                }
              }} 
              className={cashboxPrimary}
            >
              {showAllHistory ? 'Ocultar Historial' : '📋 Ver Historial'}
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* SECCIÓN DE CAJA ABIERTA */}
      {openCashbox && !showAllHistory && (
        <div className="mb-8">
          <div className="mb-4 p-4 rounded bg-green-50 border">
            <div className="font-semibold">Caja abierta (ID: {openCashbox.id})</div>
            <div className="text-sm text-gray-700">Abierta: {openCashbox.openedAt ? new Date(openCashbox.openedAt).toLocaleString() : "-"}</div>
            <div className="text-sm text-gray-700">Inicial: {(openCashbox.initialAmount ?? 0).toFixed(2)}</div>
          </div>

          {view === "ventas" && (
            <SalesPage
              sales={sales || []}
              onReload={() => loadSales(openCashbox.id)}
              openCashboxId={openCashbox.id}
              token={_token}
              onEditSale={handleEditSale}
            />
          )}

          {view === "gastos" && openCashbox && (
            <ExpensesPage
              expenses={expenses}
              onReload={() => loadExpenses(openCashbox.id)}
              openCashboxId={openCashbox.id}
              token={_token}
              isClosedCashbox={false}
              onEditExpense={handleEditExpense}
            />
          )}
          {view === "paymentMethods" && (
            <PaymentMethodsPage
              cashBoxId={openCashbox?.id}
              onBack={() => setView(null)}
              isClosedCashbox={false}
            />
          )}
        </div>
      )}

      {/* SECCIÓN DE HISTORIAL - UNIFICADA */}
      {(showAllHistory || !openCashbox) && hasPermission(Permission.CASHBOX_READ) && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {showAllHistory ? 'Historial Completo de Cajas' : 'Historial Reciente'}
            </h2>
            {!showAllHistory && cashboxes.length > 5 && (
              <button 
                onClick={() => setShowAllHistory(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todas ({totalCashboxes}) →
              </button>
            )}
          </div>
          
          {cashboxes.length > 0 ? (
            <>
              <TableHistorialCajas
                boxes={showAllHistory ? cashboxes : cashboxes.slice(0, 5)}
                onViewDetails={handleViewDetails}
                onReopen={handleReopenCashbox}
                showReopen={true}
                compact={!showAllHistory}
              />
              
              {/* Paginación para vista completa */}
              {showAllHistory && totalCashboxes > HISTORY_PER_PAGE && (
                <div className="mt-4 flex justify-center items-center space-x-4">
                  <button
                    onClick={() => {
                      setHistoryPage(prev => Math.max(1, prev - 1));
                    }}
                    disabled={historyPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm">
                    Página {historyPage} de {Math.ceil(totalCashboxes / HISTORY_PER_PAGE)}
                  </span>
                  <button
                    onClick={() => {
                      setHistoryPage(prev => 
                        prev < Math.ceil(totalCashboxes / HISTORY_PER_PAGE) 
                          ? prev + 1 
                          : prev
                      );
                    }}
                    disabled={historyPage >= Math.ceil(totalCashboxes / HISTORY_PER_PAGE)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No hay historial de cajas</p>
            </div>
          )}
        </div>
      )}

      {/* MODALES (se mantienen igual) */}
      {showOpenModal && (
        <OpenCashboxModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={loadAll}
        />
      )}

      {showCloseModal && openCashbox && closeData && (
        <CloseCashModal
          cashbox={openCashbox}
          closePreview={closeData}
          onClose={() => {
            setShowCloseModal(false);
            setCloseData(null);
          }}
          onConfirm={handleConfirmClose}
        />
      )}
      
      {showReopenModal && cashboxToReopen && (
        <ReopenCashboxModal
          cashbox={cashboxToReopen}
          onClose={() => {
            setShowReopenModal(false);
            setCashboxToReopen(null);
          }}
          onSuccess={() => {
            loadAll();
            setShowReopenModal(false);
            setCashboxToReopen(null);
          }}
        />
      )}

      {showEditSaleModal && selectedSaleForEdit && (selectedCashbox || openCashbox) && (
        <EditSaleModal
          sale={selectedSaleForEdit}
          cashboxId={(selectedCashbox || openCashbox)?.id}
          branchId={(selectedCashbox || openCashbox)?.branchId}
          onClose={() => {
            setShowEditSaleModal(false);
            setSelectedSaleForEdit(null);
          }}
          onSuccess={() => {
            if (selectedCashbox) loadSales(selectedCashbox.id);
            if (openCashbox) loadSales(openCashbox.id);
            setShowEditSaleModal(false);
            setSelectedSaleForEdit(null);
          }}
        />
      )}

      {showEditExpenseModal && selectedExpenseForEdit && (selectedCashbox || openCashbox) && (
        <EditExpenseModal
          expense={selectedExpenseForEdit}
          cashboxId={(selectedCashbox || openCashbox)?.id}
          branchId={(selectedCashbox || openCashbox)?.branchId}
          onClose={() => {
            setShowEditExpenseModal(false);
            setSelectedExpenseForEdit(null);
          }}
          onSuccess={() => {
            if (selectedCashbox) loadExpenses(selectedCashbox.id);
            if (openCashbox) loadExpenses(openCashbox.id);
            setShowEditExpenseModal(false);
            setSelectedExpenseForEdit(null);
          }}
        />
      )}
    </div>
  );
}
