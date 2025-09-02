// src/components/BoxDetailsModal.tsx
import { useEffect, useState } from "react";
import { cashboxService } from "../services/cashboxService";
//import { useAuth } from "../context/authContext";

export default function BoxDetailsModal({ boxId, onClose, token }: { boxId: number; onClose: ()=>void; token?: string }) {
  const [box, setBox] = useState<any | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [boxId]);

  async function load() {
    setLoading(true);
    try {
      const r = await cashboxService.getById(boxId, token);
      const data = r.data;
      setBox(data.box ?? data);
      setSales(data.sales ?? []);
      setExpenses(data.expenses ?? []);
    } catch (err) {
      console.error("BoxDetailsModal.load", err);
      setBox(null);
      setSales([]);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded p-4 w-[900px] max-h-[85vh] overflow-auto shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Detalle Caja #{box?.id ?? boxId}</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 bg-gray-200 rounded">Cerrar</button>
        </div>

        {loading ? <div>Cargando...</div> : (
          <>
            <div className="mb-3">
              <div>Apertura: {box ? new Date(box.openedAt).toLocaleString() : "-"}</div>
              <div>Inicial: ${box ? (box.initialAmount ?? 0).toFixed(2) : "0.00"}</div>
              <div>Estado: {box?.status ?? "-"}</div>
              <div>Cerrada: {box?.closedAt ? new Date(box.closedAt).toLocaleString() : "-"}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold">Ventas</h4>
                <div className="border rounded p-2 max-h-[350px] overflow-auto">
                  {sales.length === 0 ? <div className="text-gray-500">No hay ventas.</div> : (
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-gray-600"><tr><th>Fecha</th><th>Items</th><th>Monto</th></tr></thead>
                      <tbody>{sales.map((s:any)=>(<tr key={s.id}><td>{new Date(s.createdAt).toLocaleString()}</td><td>{s.items?.length}</td><td>${s.total?.toFixed(2)}</td></tr>))}</tbody>
                    </table>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold">Gastos</h4>
                <div className="border rounded p-2 max-h-[350px] overflow-auto">
                  {expenses.length === 0 ? <div className="text-gray-500">No hay gastos.</div> : (
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-gray-600"><tr><th>Fecha</th><th>Concepto</th><th>Monto</th></tr></thead>
                      <tbody>{expenses.map((e:any)=>(<tr key={e.id}><td>{new Date(e.createdAt).toLocaleString()}</td><td>{e.concept}</td><td>${e.amount?.toFixed(2)}</td></tr>))}</tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
