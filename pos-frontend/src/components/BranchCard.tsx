import type { Branch } from "../services/branchService";

interface BranchCardProps {
  branch: Branch;
  onSelect: () => void;
}

export default function BranchCard({ branch, onSelect }: BranchCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow p-6">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{branch.name}</h3>
        <span className={`px-2 py-1 text-xs rounded-full ${
          branch.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {branch.isActive ? 'Activa' : 'Inactiva'}
        </span>
      </div>
      
      {branch.address && (
        <div className="flex items-center gap-2 text-gray-600 mb-2">
          <span>📍</span>
          <p className="text-sm">{branch.address}</p>
        </div>
      )}
      
      {branch.phone && (
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <span>📞</span>
          <p className="text-sm">{branch.phone}</p>
        </div>
      )}

      <button
        onClick={onSelect}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
      >
        Ingresar a esta sucursal
      </button>
    </div>
  );
}