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

export default function CashboxPage() {
  const { token } = useAuth();
  const _token = token ?? undefined;

  const [openCashbox, setOpenCashbox] = useState<any | null>(null);
  const [selectedCashbox, setSelectedCashbox] = useState<any | null>(null);
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
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

  const { hasPermission } = usePermissions();
 

  useEffect(() => {
    loadAll();
  }, [_token]);
  
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
    setWarning(null);
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
    try {
      //solo intentar cargar si el usuario tiene permiso
      if(hasPermission(Permission.CASHBOX_READ)) {
        const rList = await cashboxService.list();
        // Axios envuelve en .data, y tu backend devuelve { total, data }
        const boxes = rList.data?.data || rList.data || [];
        setCashboxes(Array.isArray(boxes) ? boxes : []);
      } else {
        setCashboxes([]);
      }
    } catch(error) {
      console.error('❌ Error loading cashbox history:', error);
      // solo mostar el warning si el usuario SI deberia tener acceso
      if (hasPermission(Permission.CASHBOX_READ)){
        setWarning("Error cargando historial de cajas.");
      }
      setCashboxes([]);
    } finally {
      setLoading(false);
    }
  }

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
    if (!openCashbox?.id) return alert("No hay caja abierta.");
    if (!confirm("¿Cerrar caja ahora?")) return;
    try {
    setLoading(true);
    const response = await cashboxService.getClosePreview(openCashbox.id);
    setCloseData(response.data);
    setShowCloseModal(true);
  } catch (error) {
    console.error('Error getting close preview:', error);
    alert('Error al obtener datos de cierre');
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
      alert('No hay caja activa');
      return;
    }

    // Permitir edición en cajas OPEN y REOPENED
    if (activeCashbox.status !== 'OPEN' && activeCashbox.status !== 'REOPENED') {
      alert('Solo se pueden editar ventas en cajas abiertas');
      return;
    }

    // Verificar que la venta pertenezca a esta caja
    if (sale.cashBoxId !== activeCashbox.id) {
      alert('Esta venta no pertenece a esta caja');
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
      alert('No hay caja activa');
      return;
    }

    // Permitir edición en cajas OPEN y REOPENED
    if (activeCashbox.status !== 'OPEN' && activeCashbox.status !== 'REOPENED') {
      alert('Solo se pueden editar gastos en cajas abiertas');
      return;
    }

    setSelectedExpenseForEdit(expense);
    setShowEditExpenseModal(true);
  };


  const handleCloseReopened = async () => {
    if (!openCashbox?.id) return;
    
    // Confirmación especial para cajas reabiertas
    const confirmMessage = `¿Cerrar caja reabierta #${openCashbox.id}?\n\nIMPORTANTE:\n• No se volverá a contar el efectivo\n• Se mantendrá el monto real original (Bs. ${openCashbox.realClosedAmount?.toFixed(2) || openCashbox.closedAmount?.toFixed(2)})\n• Solo se actualizarán los totales de ventas y gastos`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setLoading(true);
      await cashboxService.closeReopened(openCashbox.id);
      await loadAll();
    } catch (error: any) {
      console.error('Error closing reopened cashbox:', error);
      alert(error.response?.data?.error || 'Error al cerrar caja reabierta');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Cargando caja...</div>;


  // Vista de historial de cajas
  if (view === "history") {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Historial de Cajas</h1>
          <button 
            onClick={() => setView(null)} 
            className="px-3 py-2 bg-gray-600 text-white rounded"
          >
            Volver
          </button>
        </div>

        {cashboxes.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abierta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cerrada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicial</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cashboxes.map((box: any) => (
                  <tr key={box.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">#{box.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(box.openedAt).toLocaleString('es-BO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {box.closedAt ? new Date(box.closedAt).toLocaleString('es-BO') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      Bs. {box.initialAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {box.closedAmount ? `Bs. ${box.closedAmount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        box.status === 'OPEN' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {box.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => {
                          handleViewDetails(box);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No hay historial de cajas</p>
          </div>
        )}
      </div>
    );
  }

  if (selectedCashbox) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Detalles de Caja #{selectedCashbox.id}</h1>
            <p className="text-sm text-gray-600">Modo solo lectura</p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setView("ventas")} 
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              Ventas
            </button>
            <button 
              onClick={() => setView("gastos")} 
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              Gastos
            </button>
            <button 
              onClick={() => setView("paymentMethods")} 
              className="px-3 py-2 bg-blue-500 text-white rounded"
            >
              Métodos de pago
            </button>
            <button 
              onClick={handleCloseDetails} 
              className="px-3 py-2 bg-gray-500 text-white rounded"
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
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
                >
                  Cerrar Reapertura
                </button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
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
              isReopened={selectedCashbox?.status === 'REOPENED'}
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
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Caja</h1>
        <div className="flex gap-2">
          {!hasPermission(Permission.CASHBOX_OPEN_CLOSE) && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Modo Vendedor:</strong> Solo puedes realizar ventas cuando la caja esté abierta.
                    Contacta a un supervisor para abrir/cerrar caja.
                  </p>
                </div>
              </div>
            </div>
          )}
          <PermissionGuard permission={Permission.CASHBOX_OPEN_CLOSE}>
            {!openCashbox && (
              <button
                onClick={() => setShowOpenModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded"
              >
                Abrir Caja
              </button>
            )}
          </PermissionGuard>
          {openCashbox && (
            <>
              <button onClick={() => setView("ventas")} className="px-3 py-2 bg-blue-500 text-white rounded">Ventas</button>
              <button onClick={() => setView("gastos")} className="px-3 py-2 bg-blue-500 text-white rounded">Gastos</button>
              <button onClick={() => setView("paymentMethods")} className="px-3 py-2 bg-blue-500 text-white rounded">Métodos de pago</button>
              <PermissionGuard permission={Permission.CASHBOX_OPEN_CLOSE}>
                {openCashbox.status === 'OPEN' && (
                  <button onClick={handleCloseCashbox} className="px-3 py-2 bg-red-500 text-white rounded">Cerrar</button>
                )}
                {openCashbox.status === 'REOPENED' && (
                  <button onClick={handleCloseReopened} className="px-3 py-2 bg-orange-500 text-white rounded">Cerrar Reapertura</button>
                )}
              </PermissionGuard>
            </>
          )}
          <PermissionGuard permission={Permission.CASHBOX_READ_ALL}>
            <button 
              onClick={() => setView("history")} 
              className="px-3 py-2 bg-purple-600 text-white rounded"
            >
              📋 Historial
            </button>
          </PermissionGuard>
        </div>
      </div>

      {warning && <div className="mb-4 text-sm text-red-600">{warning}</div>}

      {openCashbox ? (
        <>
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
        </>
      ) : (
        <div>
          <p className="mb-3">No hay ninguna caja abierta en este momento.</p>
          <PermissionGuard permission={Permission.CASHBOX_READ}>
            {cashboxes.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold mb-4">Historial de Cajas</h2>
                <PermissionGuard permission={Permission.CASHBOX_READ_ALL}>
                  <button 
                      onClick={() => setView("history")} 
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver todas →
                    </button>
                </PermissionGuard>
                </div>
                <PermissionGuard permission={Permission.CASHBOX_READ}>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abierta</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cerrada</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inicial</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Final</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {cashboxes.map((box: any) => (
                          <tr key={box.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{box.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(box.openedAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {box.closedAt ? new Date(box.closedAt).toLocaleString() : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {box.initialAmount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {box.closedAmount?.toFixed(2) || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                box.status === 'OPEN' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {box.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {box.status === 'CLOSED' && hasPermission(Permission.CASHBOX_REOPEN) && (
                                <button
                                  onClick={() => handleReopenCashbox(box)}
                                  className="px-3 py-1 bg-yellow-500 text-white rounded text-sm mr-2"
                                >
                                  Reabrir
                                </button>
                              )}
                              <button
                                onClick={() => handleViewDetails(box)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Ver detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </PermissionGuard>
              </div>
            )}
          </PermissionGuard>
          <PermissionGuard permission={Permission.CASHBOX_READ}>
            {cashboxes.length === 0 && (
              <div className="mt-6 text-center text-gray-500">
                <p>No hay historial de cajas</p>
              </div>
            )}
          </PermissionGuard>
        </div>
      )}

      {showOpenModal && (
        <OpenCashboxModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={loadAll}
        />
      )}

      {showCloseModal && openCashbox && closeData && (
        <CloseCashModal
        cashbox={openCashbox}
        closePreview={closeData} // ← Pasar los datos calculados
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

      {/* {showReportModal && selectedCashbox && (
        <CashboxReportModal
          cashbox={selectedCashbox}
          onClose={() => setShowReportModal(false)}
        />
      )} */}
      
    </div>
  );
}
