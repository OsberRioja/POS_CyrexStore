import { useMemo, useState } from 'react';
import BranchFormModal from '../components/BranchFormModal';
import { useBranch } from '../hooks/useBranch';
import type { Branch } from '../services/branchService';

export default function BranchSettingsPage() {
  const { branches, loading, error, reloadBranches } = useBranch();
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sortedBranches = useMemo(
    () => [...branches].sort((a, b) => a.name.localeCompare(b.name)),
    [branches]
  );

  const handleSuccess = () => {
    setSuccess('Sucursal actualizada correctamente');
    setEditingBranch(null);
    reloadBranches();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">⚙️ Configuración de Sucursales</h1>
        <p className="text-gray-600 mt-1">
          Edita nombre, dirección y teléfono de sucursales existentes.
        </p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left p-3">Sucursal</th>
              <th className="text-left p-3">Dirección</th>
              <th className="text-left p-3">Teléfono</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-right p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedBranches.map((branch) => (
              <tr key={branch.id} className="border-t border-gray-100">
                <td className="p-3 font-medium text-gray-800">{branch.name}</td>
                <td className="p-3 text-gray-600">{branch.address || '—'}</td>
                <td className="p-3 text-gray-600">{branch.phone || '—'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {branch.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => {
                      setSuccess(null);
                      setEditingBranch(branch);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!loading && sortedBranches.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  No hay sucursales cargadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingBranch && (
        <BranchFormModal
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
