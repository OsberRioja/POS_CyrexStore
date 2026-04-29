import { useEffect, useState } from 'react';
import { branchService } from '../services/branchService';
import { useVisualBranchFilter } from '../context/visualBranchFilterContext';

type Branch = { id: number; name: string };

export default function VisualBranchSelector() {
  const { selectedBranchId, setSelectedBranchId } = useVisualBranchFilter();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    branchService.getAll().then((res) => setBranches(res.data ?? [])).catch(() => setBranches([]));
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Sucursal:</span>
      <select
        className="border rounded px-2 py-1 text-sm"
        value={selectedBranchId ?? ''}
        onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Todas las sucursales</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </select>
    </div>
  );
}
