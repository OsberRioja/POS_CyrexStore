import { useEffect, useState } from "react";
import { cashboxService } from "../services/cashboxService";
import { saleService } from "../services/saleService";
import { expenseService } from "../services/expenseService";
import OpenCashboxModal from "../components/openBoxModal";
import { useAuth } from "../context/authContext";
import SalesPage from "./salesPage";
import ExpensesPage from "./expensesPage";
import PaymentMethodsPage from "./paymentMethodPage";

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
  const [view, setView] = useState<"ventas" | "gastos" | "paymentMethods" | null>(null);

  const [showOpenModal, setShowOpenModal] = useState(false);

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
      const r = await expenseService.listByBox(boxId, _token);
      setExpenses(Array.isArray(r?.data) ? r.data : []);
    } catch {
      setExpenses([]);
    }
  }

  async function loadAll() {
    setLoading(true);
    setWarning(null);
    try {
      const rOpen = await cashboxService.getOpen(_token);
      const open = rOpen?.data ?? null;
      setOpenCashbox(open);
      if (open?.id) {
        await Promise.all([loadSales(open.id), loadExpenses(open.id)]);
      } else {
        setSales([]);
        setExpenses([]);
      }
    } catch {
      setOpenCashbox(null);
    }
    try {
      const rList = await cashboxService.list(_token);
      console.log('Raw response:', rList); // DEBUG
      console.log('Response data:', rList.data); // DEBUG

      // Axios envuelve en .data, y tu backend devuelve { total, data }
      const boxes = rList.data?.data || rList.data || [];
      console.log('Boxes to display:', boxes); // DEBUG
      setCashboxes(Array.isArray(boxes) ? boxes : []);
    } catch {
      setCashboxes([]);
      setWarning("Error cargando historial de cajas.");
    } finally {
      setLoading(false);
    }
  }

  const handleViewDetails = async (box: any) => {
    setSelectedCashbox(box);
    setView("ventas"); // Comenzar mostrando ventas
    try {
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
    await cashboxService.close(openCashbox.id, undefined, _token);
    await loadAll();
  };

  if (loading) return <div className="p-6">Cargando caja...</div>;

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
              className="px-3 py-2 bg-yellow-600 text-white rounded"
            >
              Gastos
            </button>
            <button 
              onClick={() => setView("paymentMethods")} 
              className="px-3 py-2 bg-indigo-600 text-white rounded"
            >
              Métodos de pago
            </button>
            <button 
              onClick={handleCloseDetails} 
              className="px-3 py-2 bg-gray-600 text-white rounded"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 rounded bg-blue-50 border border-blue-200">
          <div className="font-semibold">Caja cerrada (ID: {selectedCashbox.id})</div>
          <div className="text-sm text-gray-700">
            Abierta: {new Date(selectedCashbox.openedAt).toLocaleString('es-BO')}
          </div>
          <div className="text-sm text-gray-700">
            Cerrada: {selectedCashbox.closedAt ? new Date(selectedCashbox.closedAt).toLocaleString('es-BO') : '-'}
          </div>
          <div className="text-sm text-gray-700">
            Inicial: Bs. {selectedCashbox.initialAmount.toFixed(2)}
          </div>
          <div className="text-sm text-gray-700">
            Final: {selectedCashbox.closedAmount ? `Bs. ${selectedCashbox.closedAmount.toFixed(2)}` : '-'}
          </div>
        </div>

        {view === "ventas" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Ventas</h3>
              {/* Sin botón de "Nuevo" porque es solo lectura */}
            </div>
            <SalesPage
              sales={sales || []}
              onViewSale={(sale: any) => console.log('Ver venta:', sale)} // Puedes implementar un modal de detalles
              onAddPayment={() => {}} // Deshabilitado en vista histórica
            />
          </div>
        )}

        {view === "gastos" && (
          <ExpensesPage
            expenses={expenses}
            onReload={() => loadExpenses(selectedCashbox.id)}
            openCashboxId={null} // null = no se puede agregar gastos
            token={_token}
          />
        )}

        {view === "paymentMethods" && (
          <PaymentMethodsPage
            cashBoxId={selectedCashbox.id}
            onBack={() => setView(null)}
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
          {!openCashbox && (
            <button
              onClick={() => setShowOpenModal(true)}
              className="px-3 py-2 bg-green-600 text-white rounded"
            >
              Abrir
            </button>
          )}
          {openCashbox && (
            <>
              <button onClick={() => setView("ventas")} className="px-3 py-2 bg-blue-500 text-white rounded">Ventas</button>
              <button onClick={() => setView("gastos")} className="px-3 py-2 bg-yellow-600 text-white rounded">Gastos</button>
              <button onClick={() => setView("paymentMethods")} className="px-3 py-2 bg-indigo-600 text-white rounded">Métodos de pago</button>
              <button onClick={handleCloseCashbox} className="px-3 py-2 bg-red-600 text-white rounded">Cerrar</button>
            </>
          )}
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
            />
          )}

          {view === "gastos" && (
            <ExpensesPage
              expenses={expenses}
              onReload={() => loadExpenses(openCashbox.id)}
              openCashboxId={openCashbox.id}
              token={_token}
            />
          )}
          {view === "paymentMethods" && (
            <PaymentMethodsPage
              cashBoxId={openCashbox?.id}
              onBack={() => setView(null)}
            />
          )}
        </>
      ) : (
        <div>
          <p className="mb-3">No hay ninguna caja abierta en este momento.</p>
          
          {cashboxes.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Historial de Cajas</h2>
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
            </div>
          )}
          {cashboxes.length === 0 && (
            <div className="mt-6 text-center text-gray-500">
              <p>No hay historial de cajas</p>
            </div>
          )}
        </div>
      )}

      {showOpenModal && (
        <OpenCashboxModal
          onClose={() => setShowOpenModal(false)}
          onSuccess={loadAll}
          token={_token}
        />
      )}
    </div>
  );
}
