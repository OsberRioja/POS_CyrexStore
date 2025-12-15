import { useState } from 'react';
import { 
  Home, 
  Package, 
  Users, 
  UserCircle, 
  Building, 
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Receipt,
  Flag,
  Bell,
  Shield,
  TrendingUp,
  CreditCard,
  ClipboardCheck
} from 'lucide-react';
import { useAuth } from '../context/authContext';

interface SidebarProps {
  selected: string | null;
  onSelect: (page: string | null) => void;
  user: any;
}

const SidebarProfessional: React.FC<SidebarProps> = ({ selected, onSelect, user }) => {
  const { exitToAdminHome, isInBranchMode } = useAuth();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    reports: false,
    settings: false
  });

  // Permisos
  const showStock = user?.role !== 'SELLER';
  const showUsers = user?.role === 'ADMIN';
  const showProviders = user?.role !== 'SELLER';
  const showReports = user?.role === 'ADMIN' || user?.role === 'SUPERVISOR';
  const showSettings = user?.role === 'ADMIN';
  const showDashboard = user && (user.branchId !== null || isInBranchMode);
  const showExitButton = user?.role === 'ADMIN' && user?.branchId === null && isInBranchMode;

  const toggleMenu = (menu: string) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const menuItems = [
    showDashboard && {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={20} />,
      color: 'text-blue-500'
    },
    {
      id: 'caja',
      label: 'Caja',
      icon: <CreditCard size={20} />,
      color: 'text-green-500'
    },
    showStock && {
      id: 'stock',
      label: 'Gestión de Stock',
      icon: <Package size={20} />,
      color: 'text-orange-500'
    },
    showUsers && {
      id: 'usuarios',
      label: 'Usuarios',
      icon: <Users size={20} />,
      color: 'text-purple-500'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <UserCircle size={20} />,
      color: 'text-cyan-500'
    },
    showProviders && {
      id: 'proveedores',
      label: 'Proveedores',
      icon: <Building size={20} />,
      color: 'text-red-500'
    },
    {
      id: 'productos',
      label: 'Productos',
      icon: <ShoppingCart size={20} />,
      color: 'text-indigo-500'
    },
  ].filter(Boolean);

  const reportItems = [
    {
      id: 'comisiones',
      label: 'Comisiones',
      icon: <DollarSign size={18} />,
      color: 'text-yellow-500'
    },
    {
      id: 'reportes-avanzados',
      label: 'Reportes Avanzados',
      icon: <TrendingUp size={18} />,
      color: 'text-emerald-500'
    }
  ];

  const settingItems = [
    {
      id: 'config-comisiones',
      label: 'Comisiones',
      icon: <ClipboardCheck size={18} />,
      color: 'text-amber-500'
    },
    {
      id: 'divisas',
      label: 'Divisas',
      icon: <Flag size={18} />,
      color: 'text-sky-500'
    },
    {
      id: 'config-comprobante',
      label: 'Comprobante',
      icon: <Receipt size={18} />,
      color: 'text-gray-500'
    }
  ];

  const handleClick = (id: string | null) => {
    onSelect(id);
  };

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl z-40 flex flex-col">
      {/* Logo y título */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold">CYREX POS</h2>
            <p className="text-xs text-gray-400">Sistema Multisucursal</p>
          </div>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="font-semibold">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</p>
            {user?.role === 'ADMIN' && user?.branchId === null && (
              <p className="text-xs text-blue-300 mt-1">
                {isInBranchMode ? 'Admin Global' : 'Modo Admin'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Menú principal - Scrollable */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav className="space-y-1">
          {/* Menú principal */}
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-wider text-gray-400 px-3 mb-3 font-semibold">
              Navegación Principal
            </h3>
            <div className="space-y-1">
              {menuItems.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => handleClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 ${
                    selected === item.id
                      ? 'bg-blue-900/50 text-white border-l-4 border-blue-500'
                      : 'hover:bg-gray-700/50 text-gray-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={item.color}>
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  {selected === item.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Reportes (si tiene permiso) */}
          {showReports && (
            <div className="mb-6">
              <button
                onClick={() => toggleMenu('reports')}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-emerald-500">
                    <BarChart3 size={20} />
                  </div>
                  <span className="text-sm font-medium">Reportes</span>
                </div>
                {openMenus.reports ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </button>

              {openMenus.reports && (
                <div className="ml-8 mt-2 space-y-1">
                  {reportItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleClick(item.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        selected === item.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`mr-3 ${item.color}`}>
                        {item.icon}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Configuración (si tiene permiso) */}
          {showSettings && (
            <div className="mb-6">
              <button
                onClick={() => toggleMenu('settings')}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-amber-500">
                    <Settings size={20} />
                  </div>
                  <span className="text-sm font-medium">Configuración</span>
                </div>
                {openMenus.settings ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
              </button>

              {openMenus.settings && (
                <div className="ml-8 mt-2 space-y-1">
                  {settingItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleClick(item.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                        selected === item.id
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <div className={`mr-3 ${item.color}`}>
                        {item.icon}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alertas/Notificaciones (opcional) */}
          <div className="px-3 py-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center space-x-2">
                <Bell size={16} className="text-yellow-500" />
                <span className="text-xs font-medium">Alertas de Stock</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {user?.role === 'ADMIN' || user?.role === 'SUPERVISOR' 
                  ? 'Monitoreo en tiempo real' 
                  : 'Notificaciones activas'}
              </p>
            </div>
          </div>
        </nav>
      </div>

      {/* Pie del sidebar */}
      <div className="border-t border-gray-700 p-4">
        {showExitButton ? (
          <button
            onClick={() => {
              exitToAdminHome();
              onSelect(null);
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 rounded-lg transition-all duration-200 border border-gray-600"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Salir a Admin</span>
          </button>
        ) : (
          <div className="text-center">
            <p className="text-xs text-gray-400">Sistema POS v2.0</p>
            <p className="text-xs text-gray-500 mt-1">© 2025 Cyrex Store</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarProfessional;