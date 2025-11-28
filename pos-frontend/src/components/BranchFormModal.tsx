// En src/components/BranchFormModal.tsx - MEJORAR
import { useState } from "react";
import { useBranch } from "../hooks/useBranch";

interface BranchFormModalProps {
  onClose: () => void;
  onSuccess: (newBranch?: any) => void;
  branch?: any;
}

export default function BranchFormModal({ onClose, onSuccess, branch }: BranchFormModalProps) {
  const { createBranch } = useBranch();
  const [formData, setFormData] = useState({
    name: branch?.name || "",
    address: branch?.address || "",
    phone: branch?.phone || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación mejorada
    const name = formData.name.trim();
    if (!name) {
      setError("El nombre de la sucursal es requerido");
      return;
    }

    if (name.length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (name.length > 50) {
      setError("El nombre no puede exceder los 50 caracteres");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const newBranch = await createBranch({
        name: name,
        address: formData.address.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });
      
      // Llamar onSuccess con la nueva sucursal creada
      onSuccess(newBranch);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const isLoading = submitting;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {branch ? "Editar Sucursal" : "Crear Nueva Sucursal"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Sucursal *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
                maxLength={50}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Ej: Sucursal Centro"
                autoFocus
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.name.length}/50
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Ej: Av. Principal #123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Ej: 555-1234"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2 min-w-[120px] justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando...
                  </>
                ) : (
                  "Crear Sucursal"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}