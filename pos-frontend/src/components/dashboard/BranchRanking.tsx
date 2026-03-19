import React from 'react';
import DashboardMoney from './DashboardMoney';

interface BranchRankingProps {
  branches: Array<{
    branchId: number;
    branchName: string;
    salesCount: number;
    totalAmount: number;
    averageTicket: number;
  }>;
  title?: string;
}

const BranchRanking: React.FC<BranchRankingProps> = ({ 
  branches = [],  // Valor por defecto array vacío
  title = "Ranking de Sucursales"
}) => {
  // Si no hay sucursales, mostrar mensaje
  if (branches.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No hay datos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-4">
        {branches.map((branch, index) => (
          <div key={branch.branchId || index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full mr-3 ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-gray-100 text-gray-800' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <span className="text-sm font-bold">#{index + 1}</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">{branch.branchName || "Sucursal sin nombre"}</p>
                <p className="text-sm text-gray-500">{branch.salesCount || 0} ventas</p>
              </div>
            </div>
            <div className="text-right">
              {/* CORRECCIÓN: Verificar que los valores sean números */}
              <DashboardMoney
                amount={typeof branch.totalAmount === 'number' ? branch.totalAmount : 0}
                className="font-semibold text-gray-800"
              />
              <p className="text-sm text-gray-500">
                Ticket: <DashboardMoney amount={typeof branch.averageTicket === 'number' ? branch.averageTicket : 0} />
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchRanking;