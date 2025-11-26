import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/authContext";
import { CurrencyProvider } from "./context/currencyContext";
import LoginPage from "./pages/loginPage";
import Sidebar from "./components/Sidebar";
import UsersPage from "./pages/usersPage";
import ClientsPage from "./pages/clientsPage";
import ProvidersPage from "./pages/providersPage";
import HomePage from "./pages/homePage";
import ProductsPage from "./pages/productPage";
import CashboxPage from "./pages/cashboxPage";
import StockPage from "./pages/stockPage";
import ExchangeRateSettingsPage from "./pages/ExchangeRateSettingsPage";
import Navbar from "./components/Navbar";
import CommissionsReportPage from "./pages/CommissionsReportPage";
import CommissionConfigPage from "./pages/CommissionConfigPage";
import ReceiptSettingsPage from "./pages/ReceiptSettingsPage";
import { SettingsProvider } from "./context/settingsContext";
import PasswordChangeModal from "./components/PasswordChangeModal"; // Importar el modal
import { passwordService } from "./services/passwordService"; // Importar el servicio

// Componente con manejo de errores
function MainAppWithErrorBoundary() {
  try {
    return <MainApp />;
  } catch (error) {
    console.error('Error en MainApp:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600">Error en la aplicación</h2>
          <p className="mt-2">Ha ocurrido un error. Por favor, recarga la página.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }
}

// Componente principal que maneja la lógica de autenticación
function MainApp() {
  const { 
    isAuthenticated, 
    user, 
    loading, 
    requiresPasswordChange, 
    completePasswordChange 
  } = useAuth();
  const [page, setPage] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Mostrar modal cuando se requiera cambio de contraseña
  useEffect(() => {
    if (isAuthenticated && requiresPasswordChange) {
      setShowPasswordModal(true);
    }
  }, [isAuthenticated, requiresPasswordChange]);

  // Mostrar loading mientras verifica la sesión
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated || showLogin) {
    return (
      <LoginPage 
        onLoginSuccess={() => setShowLogin(false)} 
      />
    );
  }

  // Manejar logout desde sidebar
  const handleLogout = () => {
    setShowLogin(true);
    setPage(null);
  };

  // Función para manejar el cambio de contraseña
  const handlePasswordChange = async (newPassword: string) => {
    try {
      await passwordService.changePassword({ newPassword });
      completePasswordChange(); // Actualizar el contexto
    } catch (error) {
      throw error; // El modal manejará el error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      
      <div className="flex">
        <Sidebar 
          selected={page} 
          onSelect={(p) => {
            if (p === "salir") {
              handleLogout();
            } else {
              setPage(p);
            }
          }}
          user={user}
        />

        {/* Contenedor principal */}
        <main className="flex-1 p-6">
          <div className="bg-white rounded-3xl shadow-sm min-h-[80vh] p-6 border border-gray-200">
            {page === "caja" && <CashboxPage/>}
            {page === "stock" && user?.role !== 'SELLER' && <StockPage />}
            {page === "stock" && user?.role === 'SELLER' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}
            {page === "divisas" && <ExchangeRateSettingsPage />}
            {page === "usuarios" && <UsersPage />}
            {page === "clientes" && <ClientsPage />}
            {page === "proveedores" && <ProvidersPage />}
            {page === "productos" && <ProductsPage />}
            {page === "comisiones" && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
              <CommissionsReportPage />
            )}
            {page === "comisiones" && user?.role === 'SELLER' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}
            
            {page === "config-comisiones" && user?.role === 'ADMIN' && (
              <CommissionConfigPage />
            )}
            {page === "config-comisiones" && user?.role !== 'ADMIN' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}
            {page === "config-comprobante" && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
              <ReceiptSettingsPage onBack={() => setPage(null)} />
            )}
            {page === "config-comprobante" && user?.role === 'SELLER' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}

            {page === "salir" && <HomePage />}
            {page === null && <HomePage />}
          </div>
        </main>
      </div>

      {/* Modal de cambio de contraseña obligatorio */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => {
          // No permitir cerrar el modal hasta que se cambie la contraseña
          // Solo cerrar si no está cargando y no requiere cambio
          if (!requiresPasswordChange) {
            setShowPasswordModal(false);
          }
        }}
        onPasswordChange={handlePasswordChange}
      />
    </div>
  );
}

// App principal con AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <SettingsProvider>
          <MainAppWithErrorBoundary />
        </SettingsProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}