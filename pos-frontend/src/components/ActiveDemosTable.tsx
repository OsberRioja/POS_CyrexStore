// src/components/ActiveDemosTable.tsx
import React, { useState } from 'react';
import { MonitorPlay, CheckCircle, Clock, Search } from 'lucide-react';
import CompleteDemoModal from './CompleteDemoModal';
import PaginationControls from './PaginationControls';

interface ActiveDemo {
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
  };
  user: {
    name: string;
    userCode: number;
  };
}

interface ActiveDemosTableProps {
  demos: ActiveDemo[];
  onComplete: () => void;
}

const ActiveDemosTable: React.FC<ActiveDemosTableProps> = ({ demos, onComplete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDemo, setSelectedDemo] = useState<ActiveDemo | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const DEMOS_PER_PAGE = 10;

  const filteredDemos = demos.filter(demo =>
    demo.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demo.product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demo.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredDemos.length / DEMOS_PER_PAGE));
  const paginatedDemos = filteredDemos.slice((page - 1) * DEMOS_PER_PAGE, page * DEMOS_PER_PAGE);

  const handleComplete = (demo: ActiveDemo) => {
    setSelectedDemo(demo);
    setShowCompleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getDaysInDemo = (createdAt: string) => {
    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (demos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <MonitorPlay size={48} className="mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900">No hay demos activas</h3>
        <p className="text-gray-600 mt-1">Todas las demos han sido completadas</p>
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
            placeholder="Buscar por producto, SKU o razón..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla de demos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado por</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Días</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedDemos.map((demo) => {
              const daysInDemo = getDaysInDemo(demo.createdAt);
              
              return (
                <tr key={demo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{demo.product.name}</div>
                      <div className="text-xs text-gray-500">SKU: {demo.product.sku}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex px-3 py-1 text-sm font-semibold text-purple-800 bg-purple-100 rounded-full">
                      {Math.abs(demo.quantity)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm text-gray-900">{demo.reason}</p>
                      {demo.notes && (
                        <p className="text-xs text-gray-500 mt-1">{demo.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>
                      <div>{demo.user.name}</div>
                      <div className="text-xs text-gray-500">#{demo.user.userCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(demo.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock size={16} className="text-gray-400" />
                      <span className={`text-sm font-semibold ${
                        daysInDemo > 30 ? 'text-red-600' : 
                        daysInDemo > 15 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {daysInDemo}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => handleComplete(demo)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
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

        {filteredDemos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Search size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No se encontraron demos</p>
          </div>
        )}

        {filteredDemos.length > 0 && (
          <div className="px-6 pb-4">
            <PaginationControls
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredDemos.length}
              pageSize={DEMOS_PER_PAGE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal para finalizar demo */}
      {showCompleteModal && selectedDemo && (
        <CompleteDemoModal
          demo={selectedDemo}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedDemo(null);
          }}
          onSuccess={() => {
            setShowCompleteModal(false);
            setSelectedDemo(null);
            onComplete();
          }}
        />
      )}
    </div>
  );
};

export default ActiveDemosTable;
