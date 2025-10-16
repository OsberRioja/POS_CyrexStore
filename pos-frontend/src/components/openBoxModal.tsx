// src/components/OpenCashboxModal.tsx
import React, { useState } from "react";
import { cashboxService } from "../services/cashboxService";

export default function OpenCashboxModal({ onClose, onSuccess, token } : { onClose: () => void; onSuccess: () => void; token?: string }) {
  const [initialAmount, setInitialAmount] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(initialAmount);
    if (Number.isNaN(val) || val < 0) return alert("Monto inválido.");
    setSaving(true);
    try {
      await cashboxService.open({ initialAmount: val }, token);
      onSuccess();
      onClose();
    } catch (err:any) {
      console.error(err);
      alert("Error abriendo caja. Ver consola.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setInitialAmount("0"); // Resetear el monto
    onClose();             // Cerrar el modal
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded w-96 p-4">
        <h3 className="text-lg font-semibold mb-2">Abrir caja</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-sm">Monto inicial</label>
          <input type="number" step="0.01" value={initialAmount} onChange={(e)=>setInitialAmount(e.target.value)} className="w-full border p-2 rounded autoFocus" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={handleClose} className="px-3 py-1 border rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded">{saving ? "Abriendo..." : "Abrir"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
