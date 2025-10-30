// src/components/ActiveDemosTable.tsx
import { MonitorPlay, CheckCircle } from 'lucide-react';
import { stockService } from '../services/stockService';

export default function ActiveDemosTable({ 
  demos, 
  onComplete 
}: { 
  demos: any[];
  onComplete: () => void;
}) {
  const handleCompleteDemo = async (movementId: number) => {
    const notes = prompt('Notas de finalización:');
    const resolution = prompt('Resolución:');
    
    if (notes === null || resolution === null) return;
    
    try {
      await stockService.completeDemo(movementId, { notes, resolution });
      alert('Demo finalizada exitosamente');
      onComplete();
    } catch (error: any) {
      console.error('Error completing demo:', error);
      alert('Error al finalizar demo: ' + (error.response?.data?.error || error.message));
    }
  };

  if (!demos.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MonitorPlay size={48} className="mx-auto mb-4 text-gray-400" />
        <p>No hay demos activas</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Envío</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {demos.map((demo) => (
            <tr key={demo.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div>
                  <div className="font-medium text-gray-900">{demo.product.name}</div>
                  <div className="text-sm text-gray-500">SKU: {demo.product.sku}</div>
                  <div className="text-sm text-gray-500">Stock actual: {demo.product.stock}</div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{demo.user.name}</div>
                <div className="text-sm text-gray-500">Código: {demo.user.userCode}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {Math.abs(demo.quantity)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(demo.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {demo.reason}
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => handleCompleteDemo(demo.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={16} />
                  Completar Demo
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}