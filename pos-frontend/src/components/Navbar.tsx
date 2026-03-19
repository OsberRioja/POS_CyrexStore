import { useState } from "react";
import { useAuth } from "../context/authContext";
import { useBranch } from "../hooks/useBranch";
import CurrencySelector from "./CurrencySelector";
import BranchSelector from "./BranchSelector";

export default function Navbar() {
  const { user, logout, isInBranchMode, exitToAdminHome } = useAuth();
  const { branches, currentBranchId } = useBranch();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentBranch = branches.find(branch => branch.id === currentBranchId);

  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 px-6 py-3 z-50">
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
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 px-6 py-3 z-50">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-800">CYREX STORE</h1>
          <span className="text-sm text-gray-500">
            {isInBranchMode && currentBranch ? currentBranch.name : "Tienda de Computadoras"}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {isInBranchMode && <BranchSelector />}
          {isInBranchMode && user?.role === 'ADMIN' && <CurrencySelector />}

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-sm bg-gray-50 rounded-full p-2 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-medium text-gray-700">{user.name}</div>
                <div className="text-xs text-gray-500">#{user.userCode}</div>
                {user.role === 'ADMIN' && user.branchId === null && (
                  <div className="text-xs text-blue-500">
                    {isInBranchMode ? `Admin en ${currentBranch?.name || 'Sucursal'}` : 'Modo Administración'}
                  </div>
                )}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1">Código: #{user.userCode}</div>
                    {user.role === 'ADMIN' && user.branchId === null && (
                      <div className="text-xs text-blue-500 mt-1">
                        {isInBranchMode ? `Administrador en ${currentBranch?.name}` : 'Administrador Global'}
                      </div>
                    )}
                    {isInBranchMode && currentBranch && (
                      <div className="text-xs text-green-600 mt-1">
                        <span className="font-medium">Sucursal:</span> {currentBranch.name}
                      </div>
                    )}
                  </div>
                  
                  {isInBranchMode && user.role === 'ADMIN' && user.branchId === null && (
                    <button
                      onClick={() => {
                        exitToAdminHome();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                    >
                      🏠 Volver al Panel de Administración
                    </button>
                  )}
                  
                  <button
                    onClick={logout}
                    className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100"
                  >
                    Cerrar Sesión
                  </button>
                </div>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}