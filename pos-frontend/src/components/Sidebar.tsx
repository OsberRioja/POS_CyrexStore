// Sidebar.tsx
import type { User } from "../context/authContext"; // Importar el tipo User

interface SidebarProps {
  selected: string | null;
  onSelect: (page: string | null) => void;
  user: User | null;
}

export default function Sidebar({ selected, onSelect, user }: SidebarProps) {
  return (
    <aside className="w-40 bg-transparent flex flex-col items-center py-8">
      {/* Mostrar información del usuario si está disponible */}
      {user && (
        <div className="mb-6 text-center">
          <div className="text-sm font-medium text-gray-700">{user.name}</div>
          <div className="text-xs text-gray-500">{user.role.toLowerCase()}</div>
        </div>
      )}

      <div className="w-full flex flex-col items-start pl-2 space-y-3">
        <button
          onClick={() => onSelect("caja")}
          className={`w-24 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "caja" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          💰 CAJA
        </button>

        <button
          onClick={() => onSelect("stock")}
          className={`w-24 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "stock" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          📊 STOCK
        </button>

        <button
          onClick={() => onSelect("usuarios")}
          className={`w-24 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "usuarios" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          👥 USUARIOS
        </button>

        <button
          onClick={() => { console.log('Sidebar click: clientes'); onSelect('clientes'); }}
          className={`w-24 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "clientes" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          👥 CLIENTES
        </button>

        <button
          onClick={() => { console.log('Sidebar click: proveedores'); onSelect('proveedores'); }}
          className={`w-30 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "proveedores" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          🏢 PROVEEDORES
        </button>

        <button
          onClick={() => { console.log('Sidebar click: productos'); onSelect('productos'); }}
          className={`w-30 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "productos" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          📦 PRODUCTOS
        </button>

        {/* NUEVA SECCIÓN DE CONFIGURACIÓN SOLO PARA ADMIN */}
        {user?.role === 'ADMIN' && (
          <>
            {/* Línea separadora */}
            <div className="w-full border-t border-gray-300 my-2" />
            
            {/* Título de la sección */}
            <div className="w-30 text-xs font-semibold px-3 py-1 text-gray-500 uppercase">
              Configuración
            </div>

            {/* Botón de Divisas/Tasas de Cambio */}
            <button
              onClick={() => { console.log('Sidebar click: divisas'); onSelect('divisas'); }}
              className={`w-30 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
                selected === "divisas" ? "bg-blue-600" : "bg-gray-500/90"
              }`}
            >
              💱 DIVISAS
            </button>
          </>
        )}


        <button
          onClick={() => { console.log('Sidebar click: salir'); onSelect('salir'); }}
          className={`w-24 text-sm font-semibold px-3 py-2 rounded-md shadow-sm text-white ${
            selected === "salir" ? "bg-blue-600" : "bg-gray-500/90"
          }`}
        >
          🚪 SALIR
        </button>
      </div>

      {/* línea vertical separadora */}
      <div className="absolute left-40 inset-y-0 my-auto h-3/4 w-px bg-gray-300" />
    </aside>
  );
}