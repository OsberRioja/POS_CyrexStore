import { useState } from 'react';
import type { User } from "../context/authContext";
import { useAuth } from '../context/authContext';

interface SidebarProps {
  selected: string | null;
  onSelect: (page: string | null) => void;
  user: User | null;
}

export default function Sidebar({ selected, onSelect, user }: SidebarProps) {
  const { exitToAdminHome, isInBranchMode } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Determinar qué elementos mostrar según el rol
  const showStock = user?.role !== 'SELLER';
  const showUsers = user?.role === 'ADMIN';
  const showProviders = user?.role !== 'SELLER';
  const showConfiguration = user?.role === 'ADMIN';
  const showReports = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'; 
  const showExitButton = user?.role === 'ADMIN' && user?.branchId === null && isInBranchMode;
  
  // Mostrar Dashboard si el usuario tiene una sucursal asignada o está en modo sucursal
  const showDashboard = user && (user.branchId !== null || isInBranchMode);

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const handleSelect = (page: string | null) => {
    onSelect(page);
    setOpenSubmenu(null);
  };

  const handleExitToAdminHome = () => {
    exitToAdminHome();
    onSelect(null);
  };

  return (
    <aside className="w-48 bg-transparent flex flex-col items-center py-8">
      {user && (
        <div className="mb-6 text-center">
          <div className="text-sm font-medium text-gray-700">{user.name}</div>
          <div className="text-xs text-gray-500">{user.role.toLowerCase()}</div>
          {user.role === 'ADMIN' && user.branchId === null && (
            <div className="text-xs text-blue-500 mt-1">
              {isInBranchMode ? 'Administrador Global' : 'Modo Admin'}
            </div>
          )}
        </div>
      )}

      <div className="w-full flex flex-col items-start pl-2 space-y-1">
        {/* NUEVO: Botón de Dashboard */}
        {showDashboard && (
          <button
            onClick={() => handleSelect("dashboard")}
            className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
              selected === "dashboard" ? "bg-blue-600" : "bg-gray-500/90"
            }`}
          >
            📊 DASHBOARD
          </button>
        )}
        
        <button
          onClick={() => handleSelect("caja")}
          className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "caja" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          💰 CAJA
        </button>
        
        {showStock && (
          <button
            onClick={() => handleSelect("stock")}
            className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
              selected === "stock" ? "bg-blue-600" : "bg-gray-500/90"
            }`}
          >
            📊 STOCK
          </button>
        )}

        {showUsers && (
          <button
            onClick={() => handleSelect("usuarios")}
            className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
              selected === "usuarios" ? "bg-blue-600" : "bg-gray-500/90"
            }`}
          >
            👥 USUARIOS
          </button>
        )}

        <button
          onClick={() => handleSelect('clientes')}
          className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "clientes" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          👥 CLIENTES
        </button>

        {showProviders && (
          <button
            onClick={() => handleSelect('proveedores')}
            className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
              selected === "proveedores" ? "bg-blue-600" : "bg-gray-500/90"
            }`}
          >
            🏢 PROVEEDORES
          </button>
        )}
        
        <button
          onClick={() => handleSelect('productos')}
          className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "productos" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          📦 PRODUCTOS
        </button>

        {showReports && (
          <>
            <div className="w-full border-t border-gray-300 my-2" />
            <div className="w-full">
              <button
                onClick={() => toggleSubmenu('informes')}
                className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white flex justify-between items-center ${
                  openSubmenu === 'informes' ? 'bg-blue-600' : 'bg-gray-500/90'
                }`}
              >
                <span>📈 INFORMES</span>
                <span>{openSubmenu === 'informes' ? '▲' : '▼'}</span>
              </button>
              
              {openSubmenu === 'informes' && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => handleSelect('comisiones')}
                    className={`w-36 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
                      selected === "comisiones" ? "bg-blue-500" : "bg-gray-400/90"
                    }`}
                  >
                    💰 Comisiones
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {showConfiguration && (
          <>
            <div className="w-full border-t border-gray-300 my-2" />
            <div className="w-full">
              <button
                onClick={() => toggleSubmenu('ajustes')}
                className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white flex justify-between items-center ${
                  openSubmenu === 'ajustes' ? 'bg-blue-600' : 'bg-gray-500/90'
                }`}
              >
                <span>⚙️ AJUSTES</span>
                <span>{openSubmenu === 'ajustes' ? '▲' : '▼'}</span>
              </button>
              
              {openSubmenu === 'ajustes' && (
                <div className="ml-4 mt-1 space-y-1">
                  <button
                    onClick={() => handleSelect('config-comisiones')}
                    className={`w-36 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
                      selected === "config-comisiones" ? "bg-blue-500" : "bg-gray-400/90"
                    }`}
                  >
                    💰 Comisiones
                  </button>
                  <button
                    onClick={() => handleSelect('divisas')}
                    className={`w-36 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
                      selected === "divisas" ? "bg-blue-500" : "bg-gray-400/90"
                    }`}
                  >
                    💱 Divisas
                  </button>
                  <button
                    onClick={() => handleSelect('config-comprobante')}
                    className={`w-36 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
                      selected === "config-comprobante" ? "bg-blue-500" : "bg-gray-400/90"
                    }`}
                  >
                    🔧 General
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {showExitButton && (
          <>
            <div className="w-full border-t border-gray-300 my-2" />
            <button
              onClick={handleExitToAdminHome}
              className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
                selected === "salir" ? "bg-blue-600" : "bg-gray-500/90"
              }`}
            >
              🏠 SALIR
            </button>
          </>
        )}
      </div>

      <div className="absolute left-48 inset-y-0 my-auto h-3/4 w-px bg-gray-300" />
    </aside>
  );
}