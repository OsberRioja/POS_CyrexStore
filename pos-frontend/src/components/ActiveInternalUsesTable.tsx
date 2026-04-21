import React, { useState } from 'react';
import { Building, Calendar, MapPin } from 'lucide-react';
import { stockService } from '../services/stockService';
import { useDialog } from '../context/DialogContext';
import PaginationControls from './PaginationControls';

interface InternalUse {
  id: number;
  product: {
    name: string;
    sku: string;
    branch: {
      name: string;
    };
  };
  quantity: number;
  reason: string;
  destination?: string;
  expectedReturnDate?: string;
  notes?: string;
  createdAt: string;
  user: {
    name: string;
    userCode: number;
  };
}

interface ActiveInternalUsesTableProps {
  internalUses: InternalUse[];
  onReturn: () => void;
}

const ActiveInternalUsesTable: React.FC<ActiveInternalUsesTableProps> = ({ 
  internalUses, 
  onReturn 
}) => {
  const { confirm, alert } = useDialog();
  const [page, setPage] = useState(1);
  const INTERNAL_USES_PER_PAGE = 10;

  const handleReturn = async (movementId: number) => {
    const shouldReturn = await confirm({
      title: 'Devolver producto',
      message: '¿Está seguro de devolver este producto?',
      confirmText: 'Devolver',
    });

    if (!shouldReturn) return;

    try {
      await stockService.returnInternalUse(movementId, {
        notes: 'Devuelto manualmente',
        condition: 'Buen estado'
      });
      alert('Producto devuelto exitosamente', 'success');
      onReturn();
    } catch (error) {
      console.error('Error returning internal use:', error);
      alert('Error al devolver el producto', 'error');
    }
  };

  if (!internalUses || internalUses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <Building size={48} className="mx-auto mb-4 text-gray-400" />
        <p>No hay usos internos activos</p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(internalUses.length / INTERNAL_USES_PER_PAGE));
  const paginatedInternalUses = internalUses.slice((page - 1) * INTERNAL_USES_PER_PAGE, page * INTERNAL_USES_PER_PAGE);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destino</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Retorno</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado por</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {paginatedInternalUses.map((use) => (
            <tr key={use.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900">{use.product.name}</div>
                  <div className="text-xs text-gray-500">SKU: {use.product.sku}</div>
                  <div className="text-xs text-gray-500">Sucursal: {use.product.branch.name}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded">
                  {Math.abs(use.quantity)}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="max-w-xs">
                  <p className="text-sm text-gray-900">{use.reason}</p>
                  {use.notes && (
                    <p className="text-xs text-gray-500 mt-1">Nota: {use.notes}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {use.destination ? (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span className="text-sm">{use.destination}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                {use.expectedReturnDate ? (
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span className="text-sm">
                      {new Date(use.expectedReturnDate).toLocaleDateString('es-BO')}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium">{use.user.name}</div>
                  <div className="text-xs text-gray-500">#{use.user.userCode}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleReturn(use.id)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors"
                >
                  Devolver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {internalUses.length > 0 && (
        <div className="px-6 pb-4">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalItems={internalUses.length}
            pageSize={INTERNAL_USES_PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default ActiveInternalUsesTable;
