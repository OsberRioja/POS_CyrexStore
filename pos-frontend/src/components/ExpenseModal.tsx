// src/components/ExpenseFormModal.tsx
import React, { useEffect, useState } from "react";
import { paymentMethodService } from "../services/paymentMethodService";
import { expenseService } from "../services/expenseService";

export default function ExpenseFormModal({ cashBoxId, onClose, onSuccess, token } : { cashBoxId: number; onClose: () => void; onSuccess: () => void; token?: string }) {
  const [amount, setAmount] = useState<string>("");
  const [concept, setConcept] = useState<string>("");
  const [methods, setMethods] = useState<any[]>([]);
  const [methodId, setMethodId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await paymentMethodService.list();
        setMethods(r.data ?? []);
        if (r.data?.length) setMethodId(r.data[0].id);
      } catch (err) {
        console.error("payment methods:", err);
        setMethods([]);
      }
    })();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const a = Number(amount);
    if (Number.isNaN(a) || a <= 0) return alert("Monto inválido");
    if (!concept.trim()) return alert("Concepto requerido");
    if (!methodId) return alert("Seleccione método de pago");
    setSaving(true);
    try {
      await expenseService.create({ cashBoxId, amount: a, concept, paymentMethodId: methodId }, token);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert("Error registrando gasto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded w-96 p-4">
        <h3 className="text-lg font-semibold mb-2">Registrar gasto</h3>
        <form onSubmit={submit} className="space-y-3">
          <input placeholder="Concepto" className="w-full border p-2 rounded" value={concept} onChange={(e)=>setConcept(e.target.value)} required />
          <input placeholder="Monto" className="w-full border p-2 rounded" value={amount} onChange={(e)=>setAmount(e.target.value)} required />
          <select className="w-full border p-2 rounded" value={methodId ?? ""} onChange={(e)=>setMethodId(Number(e.target.value))}>
            <option value="">Seleccionar método</option>
            {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-yellow-500 text-white rounded">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
