import React, { useState, useEffect, useCallback } from "react";
import { cashboxService } from "../services/cashboxService";

export default function OpenCashboxModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Cierre con tecla Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) handleClose();
    },
    [saving]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleClose = () => {
    if (saving) return; // Evitar cerrar mientras se está guardando
    setInitialAmount("");
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ Validación mejorada: campo vacío + NaN + negativos
    if (initialAmount === "") {
      setError("Ingresa un monto inicial.");
      return;
    }

    const val = Number(initialAmount);

    if (Number.isNaN(val) || val < 0) {
      setError("El monto debe ser un número positivo.");
      return;
    }

    setSaving(true);
    try {
      await cashboxService.open({ initialAmount: val });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      // ✅ Error en UI, sin alert()
      setError("Error al abrir la caja. Intenta nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    // ✅ role="dialog" + aria-modal para accesibilidad
    // ✅ Clic en el overlay cierra el modal
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={handleClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-white rounded w-96 p-4 shadow-lg"
        // ✅ stopPropagation para que el clic interior no cierre el modal
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="modal-title" className="text-lg font-semibold mb-2">
          Abrir caja
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="initial-amount" className="block text-sm mb-1">
              Monto inicial
            </label>
            <input
              id="initial-amount"
              type="number"
              step="0.01"
              min="0"               
              value={initialAmount}
              onChange={(e) => {
                setInitialAmount(e.target.value);
                setError(null);     // Limpia el error al escribir
              }}
              className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
              aria-invalid={!!error}
              aria-describedby={error ? "amount-error" : undefined}
              disabled={saving}
            />

            {error && (
              <p id="amount-error" role="alert" className="text-red-500 text-sm mt-1">
                {error}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}     // ✅ aria-busy para accesibilidad
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Abriendo..." : "Abrir"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}