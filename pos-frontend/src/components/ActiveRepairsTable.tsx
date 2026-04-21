import React, { useState } from 'react';
import { Wrench, CheckCircle, Clock, Search, Truck } from 'lucide-react';
import CompleteRepairModal from './CompleteRepairModal';
import PaginationControls from './PaginationControls';

interface ActiveRepair {
  id: number;
  quantity: number;
  reason: string;
  notes?: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    provider?: { // ← Proveedor del producto
      id_provider: number;
      name: string;
      phone: string;
    } | null;
  };
  provider?: { // ← Proveedor del movimiento (puede ser diferente)
    id_provider: number;
    name: string;
  } | null;
  user: {
    name: string;
    userCode: number;
  };
}

interface ActiveRepairsTableProps {
  repairs: ActiveRepair[];
  onComplete: () => void;
}

const ActiveRepairsTable: React.FC<ActiveRepairsTableProps> = ({ repairs, onComplete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRepair, setSelectedRepair] = useState<ActiveRepair | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const REPAIRS_PER_PAGE = 10;

  const filteredRepairs = repairs.filter(repair =>
    repair.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repair.provider?.name.toLowerCase().includes(searchTerm.toLowerCase())) || // ← BUSCAR POR PROVEEDOR
    (repair.product.provider?.name.toLowerCase().includes(searchTerm.toLowerCase())) // ← BUSCAR POR PROVEEDOR DEL PRODUCTO
  );
  const totalPages = Math.max(1, Math.ceil(filteredRepairs.length / REPAIRS_PER_PAGE));
  const paginatedRepairs = filteredRepairs.slice((page - 1) * REPAIRS_PER_PAGE, page * REPAIRS_PER_PAGE);

  // Función para obtener el proveedor a mostrar (prioridad: movimiento > producto)
  const getDisplayProvider = (repair: ActiveRepair) => {
    return repair.provider || repair.product.provider;
  };

  const handleComplete = (repair: ActiveRepair) => {
    setSelectedRepair(repair);
    setShowCompleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysInRepair = (createdAt: string) => {
    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (repairs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Wrench size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">No hay reparaciones activas</h3>
        <p className="text-gray-600 mt-1">Todas las reparaciones han sido completadas</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-3">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por producto, SKU, razón o proveedor..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla de reparaciones */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th> {/* ← PROVEEDOR */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado por</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Días</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedRepairs.map((repair) => {
              const daysInRepair = getDaysInRepair(repair.createdAt);
              const displayProvider = getDisplayProvider(repair);
              
              return (
                <tr key={repair.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{repair.product.name}</div>
                      <div className="text-xs text-gray-500">SKU: {repair.product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded-full">
                      {Math.abs(repair.quantity)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {displayProvider ? (
                      <div className="flex items-center gap-2">
                        <Truck size={16} className="text-green-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{displayProvider.name}</div>
                          <div className="text-xs text-gray-500">ID: {displayProvider.id_provider}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Sin proveedor</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900">{repair.reason}</p>
                      {repair.notes && (
                        <p className="text-xs text-gray-500 mt-1">{repair.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      <div>{repair.user.name}</div>
                      <div className="text-xs text-gray-500">#{repair.user.userCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(repair.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={16} className="text-gray-400" />
                      <span className={`text-sm font-semibold ${
                        daysInRepair > 30 ? 'text-red-600' : 
                        daysInRepair > 15 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {daysInRepair}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleComplete(repair)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle size={16} />
                        Finalizar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredRepairs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No se encontraron reparaciones</p>
          </div>
        )}

        {filteredRepairs.length > 0 && (
          <div className="px-6 pb-4">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredRepairs.length}
              pageSize={REPAIRS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal para finalizar reparación */}
      {showCompleteModal && selectedRepair && (
        <CompleteRepairModal
          repair={selectedRepair}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedRepair(null);
          }}
          onSuccess={() => {
            setShowCompleteModal(false);
            setSelectedRepair(null);
            onComplete();
          }}
        />
      )}
    </div>
  );
};

export default ActiveRepairsTable;
