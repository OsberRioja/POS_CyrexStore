import { useState, useEffect } from "react";
import { useAuth } from "../context/authContext";

export default function HomePage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Dashboard</h2>
        <div className="text-sm text-gray-500">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Mensaje de bienvenida principal */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ¡Bienvenido, {user?.name || "Usuario"}!
          </h1>
          <p className="text-gray-600 mb-2">
            Sistema de Punto de Venta para Tienda de Computadoras
          </p>
          <div className="text-sm text-gray-500">
            {user && (
              <div className="flex items-center justify-center space-x-4 mb-2">
                <span>Código: #{user.userCode}</span>
                <span>•</span>
                <span className="capitalize">
                  {user.role === "ADMIN" ? "Administrador" : 
                   user.role === "SUPERVISOR" ? "Supervisor" : "Vendedor"}
                </span>
              </div>
            )}
            {formatDate(currentTime)}
          </div>
        </div>
      </div>

      {/* Cards de acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:bg-blue-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Usuarios</h3>
              <p className="text-blue-600 text-sm">Gestionar usuarios del sistema</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 hover:bg-green-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Productos</h3>
              <p className="text-green-600 text-sm">Administrar inventario</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:bg-purple-100 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-800">Clientes</h3>
              <p className="text-purple-600 text-sm">Gestionar base de clientes</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">👤</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de información del sistema */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Información del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Versión:</span> 1.0.0
          </div>
          <div>
            <span className="font-medium">Estado:</span> 
            <span className="ml-1 text-green-600 font-medium">Activo</span>
          </div>
          <div>
            <span className="font-medium">Módulos:</span> Usuarios, Clientes, Productos
          </div>
          <div>
            <span className="font-medium">Tipo:</span> Sistema Multi-sucursal
          </div>
        </div>
      </div>
    </div>
  );
}