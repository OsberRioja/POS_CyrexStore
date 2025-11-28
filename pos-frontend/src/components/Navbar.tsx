import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";
import CurrencySelector from "./CurrencySelector";
import { branchService } from "../services/branchService";
import type { Branch } from "../services/branchService";

export default function Navbar() {
  const { user, logout, currentBranchId, selectBranch } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Cargar sucursales si el usuario es administrador global
  useEffect(() => {
    if (user?.role === 'ADMIN' && user.branchId === null) {
      setLoadingBranches(true);
      branchService.getAll()
        .then(response => {
          setBranches(response.data);
        })
        .catch(error => {
          console.error('Error cargando sucursales:', error);
        })
        .finally(() => {
          setLoadingBranches(false);
        });
    }
  }, [user]);

  // Determinar el nombre de la sucursal actual
  const currentBranchName = currentBranchId 
    ? branches.find(b => b.id === currentBranchId)?.name 
    : 'Sucursal Global';

  // Si no hay usuario, mostrar navbar básico
  if (!user) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">Sistema POS</h1>
            <span className="text-sm text-gray-500">Tienda de Computadoras</span>
          </div>
          <div>No autenticado</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">Sistema POS</h1>
          <span className="text-sm text-gray-500">Tienda de Computadoras</span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Selector de sucursal para administradores globales */}
          {user.role === 'ADMIN' && user.branchId === null && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sucursal:</span>
              <select
                value={currentBranchId || ''}
                onChange={(e) => {
                  const branchId = e.target.value ? parseInt(e.target.value) : null;
                  selectBranch(branchId);
                }}
                disabled={loadingBranches}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">Global</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mostrar la sucursal actual para usuarios no admin */}
          {user.role !== 'ADMIN' && currentBranchId && (
            <div className="text-sm text-gray-600">
              Sucursal: {currentBranchName}
            </div>
          )}

          <CurrencySelector />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-sm bg-gray-50 rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-medium text-gray-700">{user.name}</div>
                <div className="text-xs text-gray-500">#{user.userCode}</div>
                {currentBranchName && (
                  <div className="text-xs text-gray-400">{currentBranchName}</div>
                )}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-50 border">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-400">Código: #{user.userCode}</div>
                  {currentBranchName && (
                    <div className="text-xs text-gray-400">Sucursal: {currentBranchName}</div>
                  )}
                </div>
                
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para cerrar menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}