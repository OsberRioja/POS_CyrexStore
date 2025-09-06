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
      const r = await saleService.listByBox(cashBoxId, _token);
      setSales(Array.isArray(r?.data) ? r.data : []);
    } catch {
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
      setCashboxes(Array.isArray(rList?.data) ? rList.data : []);
    } catch {
      setCashboxes([]);
      setWarning("Error cargando historial de cajas.");
    } finally {
      setLoading(false);
    }
  }

  const handleCloseCashbox = async () => {
    if (!openCashbox?.id) return alert("No hay caja abierta.");
    if (!confirm("¿Cerrar caja ahora?")) return;
    await cashboxService.close(openCashbox.id, undefined, _token);
    await loadAll();
  };

  if (loading) return <div className="p-6">Cargando caja...</div>;

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
              sales={sales}
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
          {/* historial igual que antes */}
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
