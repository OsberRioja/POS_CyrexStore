import { useState } from 'react';
import type { User } from "../context/authContext";

interface SidebarProps {
  selected: string | null;
  onSelect: (page: string | null) => void;
  user: User | null;
}

export default function Sidebar({ selected, onSelect, user }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  // Determinar qué elementos mostrar según el rol
  const showStock = user?.role !== 'SELLER';
  const showUsers = user?.role === 'ADMIN';
  const showProviders = user?.role !== 'SELLER';
  const showConfiguration = user?.role === 'ADMIN';
  const showReports = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR'; 

  const toggleSubmenu = (menu: string) => {
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  };

  const handleSelect = (page: string | null) => {
    onSelect(page);
    // Cerrar submenús al seleccionar una página
    setOpenSubmenu(null);
  };

  return (
    <aside className="w-48 bg-transparent flex flex-col items-center py-8">
      {/* Mostrar información del usuario si está disponible */}
      {user && (
        <div className="mb-6 text-center">
          <div className="text-sm font-medium text-gray-700">{user.name}</div>
          <div className="text-xs text-gray-500">{user.role.toLowerCase()}</div>
        </div>
      )}

      <div className="w-full flex flex-col items-start pl-2 space-y-1">
        <button
          onClick={() => handleSelect("caja")}
          className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "caja" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          💰 CAJA
        </button>
        
        {/* STOCK - Solo para ADMIN y SUPERVISOR */}
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

        {/* USUARIOS - Solo para ADMIN */}
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

        {/* PROVEEDORES - Solo para ADMIN y SUPERVISOR */}
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

        {/* NUEVA SECCIÓN DE INFORMES PARA ADMIN Y SUPERVISOR */}
        {showReports && (
          <>
            <div className="w-full border-t border-gray-300 my-2" />
            
            {/* Botón de Informes con submenú */}
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
              
              {/* Submenú de Informes */}
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
                  {/* Aquí puedes agregar más opciones de informes en el futuro */}
                </div>
              )}
            </div>
          </>
        )}

        {/* NUEVA SECCIÓN DE AJUSTES SOLO PARA ADMIN */}
        {showConfiguration && (
          <>
            <div className="w-full border-t border-gray-300 my-2" />
            
            {/* Botón de Ajustes con submenú */}
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
              
              {/* Submenú de Ajustes */}
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
                  {/* Aquí puedes agregar más opciones de ajustes en el futuro */}
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={() => handleSelect('salir')}
          className={`w-40 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "salir" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          🚪 SALIR
        </button>
      </div>

      {/* línea vertical separadora */}
      <div className="absolute left-48 inset-y-0 my-auto h-3/4 w-px bg-gray-300" />
    </aside>
  );
}