// src/pages/CashboxPage.tsx
import { useEffect, useState } from "react";
import { cashboxService } from "../services/cashboxService";
import { saleService } from "../services/saleService";
import { expenseService } from "../services/expenseService";
import OpenCashboxModal from "../components/openBoxModal";
import SaleFormModal from "../components/SaleModal";
import ExpenseFormModal from "../components/ExpenseModal";
import { useAuth } from "../context/authContext";

export default function CashboxPage() {
  const { token } = useAuth(); // obtiene token del contexto (puede ser undefined)
  const _token = token ?? undefined;

  const [openCashbox, setOpenCashbox] = useState<any | null>(null);
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // modales
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_token]);

  async function loadSales(cashBoxId: number) {
    try {
      const r = await saleService.listByBox(cashBoxId, _token);
      //console.error("caja:", cashBoxId, "ventas:", r.data);
      setSales(Array.isArray(r?.data) ? r.data : []);
    } catch (err: any) {
      console.error("Error cargando ventas de caja:", err?.response?.data ?? err.message ?? err);
      setSales([]);
    } finally { setLoading(false); }
  }

  async function loadExpenses(boxId: number) {
    try {
      const r = await expenseService.listByBox(boxId, _token); 
      setExpenses(Array.isArray(r?.data) ? r.data : []);
    } catch (err: any) {
      console.error("Error cargando gastos de caja:", err?.response?.data ?? err.message ?? err);
      setExpenses([]);
    } finally { setLoading(false); }
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
      }else{
        setSales([]);
        setExpenses([]);
      }
    } catch (err: any) {
      console.error("GET /cashbox/open error:", err?.response?.data ?? err.message ?? err);
      setOpenCashbox(null);
    }
    try {
      const rList = await cashboxService.list(_token);
      setCashboxes(Array.isArray(rList?.data) ? rList.data : []);
    } catch (err: any) {
      console.error("GET /cashbox error:", err?.response?.data ?? err.message ?? err);
      setCashboxes([]);
      setWarning("Error cargando historial de cajas. Revisa la consola (Network).");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenSuccess = async () => {
    setShowOpenModal(false);
    await loadAll();
  };

  const handleSaleSuccess = async () => {
    setShowSaleModal(false);
    if(openCashbox?.id){
      await Promise.all([loadSales(openCashbox.id), cashboxService.getById(openCashbox.id, _token).then(r => setOpenCashbox(r.data)).catch(()=>{})]);
    }else{
      await loadAll();
    }
  };

  const handleExpenseSuccess = async () => {
    setShowExpenseModal(false);
    if(openCashbox?.id){
      await Promise.all([loadExpenses(openCashbox.id), cashboxService.getById(openCashbox.id, _token).then(r => setOpenCashbox(r.data)).catch(()=>{})]);
    }else{
      await loadAll();
    }
  };

  const handleCloseCashbox = async () => {
    if (!openCashbox?.id) return alert("No hay caja abierta.");
    if (!confirm("¿Cerrar caja ahora?")) return;
    try {
      await cashboxService.close(openCashbox.id, undefined, _token);
      alert("Caja cerrada.");
      await loadAll();
    } catch (err: any) {
      console.error(err);
      alert("Error al cerrar la caja. Ver consola.");
    }
  };

  if (loading) return <div className="p-6">Cargando caja...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Caja</h1>

        {/* Botones principales */}
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
              <button onClick={() => setShowSaleModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded">+ Venta</button>
              <button onClick={() => setShowExpenseModal(true)} className="px-3 py-2 bg-yellow-500 text-white rounded">+ Gasto</button>
              <button onClick={handleCloseCashbox} className="px-3 py-2 bg-red-600 text-white rounded">Cerrar</button>
            </>
          )}
        </div>
      </div>

      {warning && <div className="mb-4 text-sm text-red-600">{warning}</div>}

      {/* Contenido principal */}
      {openCashbox ? (
        <div>
          <div className="mb-4 p-4 rounded bg-green-50 border">
            <div className="font-semibold">Caja abierta (ID: {openCashbox.id})</div>
            <div className="text-sm text-gray-700">Abierta: {openCashbox.openedAt ? new Date(openCashbox.openedAt).toLocaleString() : "-"}</div>
            <div className="text-sm text-gray-700">Inicial: {(openCashbox.initialAmount ?? 0).toFixed(2)}</div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Ventas</h3>
              {sales?.length ? (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100"><tr>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Items</th>
                    <th className="p-2 text-right">Monto</th>
                    <th className="p-2 text-left">Vendedor</th>
                  </tr></thead>
                  <tbody>
                    {sales.map((s: any) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</td>
                        <td className="p-2">{(s.items ?? []).length}</td>
                        <td className="p-2 text-right">{Number(s.total ?? 0).toFixed(2)}</td>
                        <td className="p-2">{s.seller?.name ?? s.sellerName ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-gray-500">No hay ventas registradas.</p>}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Gastos</h3>
              {expenses?.length ? (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100"><tr>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Concepto</th>
                    <th className="p-2 text-right">Monto</th>
                    <th className="p-2 text-left">Método</th>
                  </tr></thead>
                  <tbody>
                    {expenses.map((e: any) => (
                      <tr key={e.id} className="border-b">
                        <td className="p-2">{e.createdAt ? new Date(e.createdAt).toLocaleString() : "-"}</td>
                        <td className="p-2">{e.concept ?? e.description ?? "-"}</td>
                        <td className="p-2 text-right">{Number(e.amount ?? 0).toFixed(2)}</td>
                        <td className="p-2">{e.paymentMethod?.name ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-gray-500">No hay gastos registrados.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-3">No hay ninguna caja abierta en este momento.</p>

          <h3 className="text-lg font-semibold mt-6">Historial de cajas</h3>
          {cashboxes.length === 0 ? (
            <p className="text-gray-500 mt-2">No hay registros de cajas anteriores.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {cashboxes.map((c) => (
                <li key={c.id} className="border p-3 rounded flex justify-between items-center">
                  <div>
                    <div><strong>Caja #{c.id}</strong></div>
                    <div className="text-sm text-gray-600">Apertura: {c.openedAt ? new Date(c.openedAt).toLocaleString() : "-"}</div>
                    <div className="text-sm text-gray-600">Inicial: {(c.initialAmount ?? 0).toFixed(2)} — Estado: {c.status ?? "-"}</div>
                  </div>
                  <div>
                    <button onClick={async () => {
                      try {
                        const r = await cashboxService.getById(c.id, _token);
                        console.log("Detalle caja:", r.data);
                        alert("Detalle cargado en consola (DevTools).");
                      } catch (err:any) {
                        console.error(err);
                        alert("Error al cargar detalle. Ver consola.");
                      }
                    }} className="px-3 py-1 bg-blue-600 text-white rounded">Ver</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modales */}
      {showOpenModal && <OpenCashboxModal onClose={() => setShowOpenModal(false)} onSuccess={handleOpenSuccess} token={_token} />}
      {showSaleModal && openCashbox && <SaleFormModal onClose={() => setShowSaleModal(false)} onSuccess={handleSaleSuccess} cashBoxId={openCashbox.id} token={_token} />}
      {showExpenseModal && openCashbox && <ExpenseFormModal onClose={() => setShowExpenseModal(false)} onSuccess={handleExpenseSuccess} cashBoxId={openCashbox.id} token={_token} />}
    </div>
  );
}
