import { Edit } from 'lucide-react'; // Importar ícono de edición

interface ExpensesTableProps {
  expenses: any[];
  onEditExpense?: (expense: any) => void;
  isReopened?: boolean;
}

export default function ExpensesTable({ 
  expenses, 
  onEditExpense,
  isReopened 
}: ExpensesTableProps) {
  if (!expenses?.length) {
    return <p className="text-gray-500">No hay gastos registrados.</p>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Concepto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Monto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Método de Pago
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Registrado por
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {expenses.map((expense: any) => (
            <tr key={expense.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(expense.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {expense.concept || expense.description || "-"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                {formatCurrency(expense.amount || 0)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {expense.paymentMethod?.name || "-"}
                {expense.paymentMethod?.isCash && (
                  <span className="ml-1 text-xs text-gray-500">(Efectivo)</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {expense.user?.name || "-"}
                {expense.user?.userCode && (
                  <span className="text-gray-500 text-xs block">#{expense.user.userCode}</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  {/* Botón de edición - SOLO para cajas reabiertas */}
                  {onEditExpense && (
                    <button
                      onClick={() => onEditExpense(expense)}
                      className="text-yellow-600 hover:text-yellow-900 p-1 rounded"
                      title="Editar gasto"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}