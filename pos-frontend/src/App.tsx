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
import PasswordChangeModal from "./components/PasswordChangeModal";
import { passwordService } from "./services/passwordService";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { ToastProvider } from "./context/ToastContext";
import AdminHomePage from "./pages/AdminHomePage";
import ReportsPage from "./pages/ReportsPage";

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
    completePasswordChange,
    isInBranchMode
  } = useAuth();
  const [authView, setAuthView] = useState<"login" | "forgot-password" | "reset-password">("login");
  const [mainPage, setMainPage] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  const isGlobalAdmin = user?.role === 'ADMIN' && user?.branchId === null;
  const shouldShowAdminHome = isGlobalAdmin && !isInBranchMode;

  // Mostrar modal cuando se requiera cambio de contraseña
  useEffect(() => {
    if (isAuthenticated && requiresPasswordChange) {
      setShowPasswordModal(true);
    }
  }, [isAuthenticated, requiresPasswordChange]);

  useEffect(() => {
    // Verificar si hay un token de reset en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl && !isAuthenticated) {
      setResetToken(tokenFromUrl);
      setAuthView('reset-password');

      // Limpiar la URL sin recargar la página
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [isAuthenticated]);

  // Mostrar loading mientras verifica la sesión
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  // ✅ VERSIÓN SIMPLIFICADA - SOLO UNA PÁGINA DE AUTH A LA VEZ
  if (!isAuthenticated) {
    switch (authView) {
      case "forgot-password":
        return (
          <ForgotPasswordPage 
            onBack={() => setAuthView("login")}
            onSuccess={() => setAuthView("login")}
          />
        );
      
      case "reset-password":
        return (
          <ResetPasswordPage 
            token={resetToken}
            onBack={() => setAuthView("login")}
            onSuccess={() => {
              setAuthView("login");
              setResetToken(null);
            }}
          />
        );
      
      case "login":
      default:
        return (
          <LoginPage 
            onLoginSuccess={() => {}} // No necesitamos hacer nada aquí porque el contexto maneja la autenticación
            onForgotPassword={() => setAuthView("forgot-password")}
          />
        );
    }
  }

  // ✅ SI ESTÁ AUTENTICADO, MOSTRAR LA APLICACIÓN NORMAL

  // Manejar logout desde sidebar
  const handleLogout = () => {
    // El logout se maneja en el contexto, pero aquí reseteamos la vista de auth
    setAuthView("login");
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

  // ✅ SI ESTÁ AUTENTICADO, DECIDIR QUÉ MOSTRAR
  if (shouldShowAdminHome) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-6">
          <AdminHomePage />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />
      <div className="flex overflow-hidden">
        <Sidebar 
          selected={mainPage} 
          onSelect={(p) => {
            if (p === "salir") {
              handleLogout();
            } else {
              setMainPage(p);
            }
          }}
          user={user}
        />

        {/* Contenedor principal */}
        <main className="flex-1 min-w-0 p-6">
          <div className="bg-white rounded-3xl shadow-sm min-h-[80vh] p-6 border border-gray-200">
            {mainPage === "dashboard" && <HomePage />}
            {mainPage === "caja" && <CashboxPage/>}
            {mainPage === "stock" && user?.role !== 'SELLER' && <StockPage />}
            {mainPage === "stock" && user?.role === 'SELLER' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}
            {mainPage === "divisas" && <ExchangeRateSettingsPage />}
            {mainPage === "usuarios" && <UsersPage />}
            {mainPage === "clientes" && <ClientsPage />}
            {mainPage === "proveedores" && <ProvidersPage />}
            {mainPage === "productos" && <ProductsPage />}
            {mainPage === "comisiones" && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
              <CommissionsReportPage />
            )}
            {mainPage === "comisiones" && user?.role === 'SELLER' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}
            {mainPage === "reportes-avanzados" && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
              <ReportsPage />
            )}
            {mainPage === "reportes-avanzados" && user?.role === 'SELLER' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}

            {mainPage === "config-comisiones" && user?.role === 'ADMIN' && (
              <CommissionConfigPage />
            )}
            {mainPage === "config-comisiones" && user?.role !== 'ADMIN' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}
            {mainPage === "config-comprobante" && (user?.role === 'ADMIN' || user?.role === 'SUPERVISOR') && (
              <ReceiptSettingsPage onBack={() => setMainPage(null)} />
            )}
            {mainPage === "config-comprobante" && user?.role === 'SELLER' && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <div className="text-xl">⛔</div>
                  <p>No tienes permisos para acceder a esta sección</p>
                </div>
              </div>
            )}

            {mainPage === "salir" && <HomePage />}
            {(mainPage === null || mainPage === "dashboard") && <HomePage />}
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
          <ToastProvider>
            <MainAppWithErrorBoundary />
          </ToastProvider>
        </SettingsProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}