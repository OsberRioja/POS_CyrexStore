// src/components/PaymentMethodForm.tsx
import React, { useEffect, useState } from "react";

export default function PaymentMethodForm({
  method,
  onClose,
  onSaved,
  saveFn,
}: {
  method?: any | null;
  onClose: () => void;
  onSaved?: () => void;
  saveFn: (payload: { name: string; isCash: boolean }) => Promise<any>;
}) {
  const [name, setName] = useState(method?.name ?? "");
  const [isCash, setIsCash] = useState<boolean>(!!method?.isCash);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(method?.name ?? "");
    setIsCash(!!method?.isCash);
  }, [method]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return alert("Nombre requerido");
    setSaving(true);
    try {
      await saveFn({ name: name.trim(), isCash });
      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-3">{method ? "Editar método" : "Nuevo método"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" className="w-full border p-2 rounded" required />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isCash} onChange={(e) => setIsCash(e.target.checked)} />
            Es efectivo (isCash)
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
