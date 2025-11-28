import { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { branchService } from '../services/branchService';
import type { Branch } from '../services/branchService';

interface BranchSelectorProps {
  onBranchSelected?: (branchId: number) => void;
}

export default function BranchSelector({ onBranchSelected }: BranchSelectorProps) {
  const { user, selectBranch, currentBranchId } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<number | ''>(currentBranchId || '');

  useEffect(() => {
    if (user?.role === 'ADMIN' && user.branchId === null) {
      setLoading(true);
      branchService.getAll()
        .then(response => {
          setBranches(response.data);
          // Si hay sucursales pero ninguna seleccionada, seleccionar la primera
          if (response.data.length > 0 && !currentBranchId) {
            const firstBranch = response.data[0].id;
            setSelectedBranch(firstBranch);
            selectBranch(firstBranch);
            onBranchSelected?.(firstBranch);
          }
        })
        .catch(error => {
          console.error('Error cargando sucursales:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, currentBranchId, selectBranch, onBranchSelected]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const branchId = e.target.value ? parseInt(e.target.value) : null;
    setSelectedBranch(branchId || '');
    if (branchId) {
      selectBranch(branchId);
      onBranchSelected?.(branchId);
    }
  };

  if (user?.role !== 'ADMIN' || user.branchId !== null) {
    return null;
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Cargando sucursales...</div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Sucursal:</span>
      <select
        value={selectedBranch}
        onChange={handleBranchChange}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">Seleccionar sucursal</option>
        {branches.map(branch => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      {!selectedBranch && (
        <span className="text-xs text-red-500">* Requerido para crear usuarios</span>
      )}
    </div>
  );
}