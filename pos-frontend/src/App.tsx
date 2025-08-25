import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import UsersPage from "./pages/usersPage";

export default function App() {
  const [page, setPage] = useState<string | null>(null); // null = Bienvenido

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar selected={page} onSelect={(p) => setPage(p)} />

      {/* Contenedor blanco con esquinas redondeadas (simula tu mockup) */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-3xl shadow-sm min-h-[80vh] p-6 border border-gray-200">
          {page === "usuarios" ? <UsersPage /> : (
            <div className="h-full flex items-start justify-start">
              <h1 className="text-3xl font-bold text-gray-800">BIENVENIDO</h1>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
