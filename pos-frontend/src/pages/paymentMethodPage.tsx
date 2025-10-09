// src/pages/PaymentMethodsPage.tsx
import { useEffect, useState } from "react";
import PaymentMethodTable from "../components/paymentMethodTable";
import PaymentMethodForm from "../components/paymentMethodForm";
import { paymentMethodService } from "../services/paymentMethodService";
import { useAuth } from "../context/authContext";

export default function PaymentMethodsPage({ cashBoxId}: { cashBoxId?: number | null; onBack?: () => void }) {
  const { token } = useAuth();
  const _token = token ?? undefined;

  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // traer métodos
      const r = await paymentMethodService.list(_token);
      const list = r.data ?? [];

      // si tenemos cashBoxId pedimos resumen y combinamos totales
      if (cashBoxId) {
        const s = await paymentMethodService.summaryByBox(cashBoxId);
        const sums = s.data ?? [];
        const map = new Map<number, number>();
        sums.forEach((x: any) => map.set(x.id, Number(x.total ?? 0)));

        const merged = list.map((m: any) => ({ ...m, total: map.get(m.id) ?? 0 }));
        setMethods(merged);
      } else {
        setMethods(list.map((m: any) => ({ ...m, total: 0 })));
      }
    } catch (err) {
      console.error("Error loading payment methods", err);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [cashBoxId]);

  const handleCreate = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (m: any) => { setEditing(m); setShowForm(true); };

  const handleSave = async (payload: { name: string; isCash: boolean }) => {
    if (editing) {
      await paymentMethodService.update(editing.id, payload, _token);
    } else {
      await paymentMethodService.create(payload, _token);
    }
    await load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar método de pago?")) return;
    try {
      await paymentMethodService.remove(id, _token);
      await load();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Métodos de pago</h2>
        <div className="flex gap-2">
          <button onClick={handleCreate} className="px-3 py-1 bg-blue-500 text-white rounded">+ Nuevo</button>
          {/* {onBack && <button onClick={onBack} className="px-3 py-1 bg-gray-300 rounded">Volver</button>} */}
        </div>
      </div>

      {loading ? <p>Cargando...</p> : <PaymentMethodTable methods={methods} onEdit={handleEdit} onDelete={handleDelete} />}

      {showForm && (
        <PaymentMethodForm
          method={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => load()}
          saveFn={(payload) => handleSave(payload)}
        />
      )}
    </div>
  );
}
