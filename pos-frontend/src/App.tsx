import { useState } from "react";
import { AuthProvider, useAuth } from "./context/authContext";
import LoginPage from "./pages/loginPage";
import Sidebar from "./components/Sidebar";
import UsersPage from "./pages/usersPage";
import ClientsPage from "./pages/clientsPage";
import ProvidersPage from "./pages/providersPage";
import HomePage from "./pages/homePage";

// Componente principal que maneja la lógica de autenticación
function MainApp() {
  const { isAuthenticated, user, loading } = useAuth();
  const [page, setPage] = useState<string | null>(null); // null = HomePage
  const [showLogin, setShowLogin] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar 
        selected={page} 
        onSelect={(p) => {
          if (p === "salir") {
            handleLogout();
          } else {
            setPage(p);
          }
        }}
        user={user} // Pasar datos del usuario al sidebar
      />

      {/* Contenedor principal */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-3xl shadow-sm min-h-[80vh] p-6 border border-gray-200">
          {page === "usuarios" && <UsersPage />}
          {page === "clientes" && <ClientsPage />}
          {page === "proveedores" && <ProvidersPage />}
          {page === "salir" && <HomePage />}
          {page === null && <HomePage />}
        </div>
      </main>
    </div>
  );
}

// App principal con AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}