import { useState } from "react";
import Sidebar from "./components/Sidebar";
import UsersPage from "./pages/usersPage";
import ClientsPage from "./pages/clientsPage";
import ProvidersPage from "./pages/providersPage";
import HomePage from "./pages/homePage";

export default function App() {
  const [page, setPage] = useState<string | null>(null); // null = Bienvenido

  // const handleSelect = (p: string | null) => {
  //   console.log("App.handleSelect:", p);
  //   setPage(p);
  // };

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar selected={page} onSelect={(p) => setPage(p)} />

      {/* Contenedor blanco con esquinas redondeadas (simula tu mockup) */}
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
