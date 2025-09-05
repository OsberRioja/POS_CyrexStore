// src/components/ExpensesTable.tsx
export default function ExpensesTable({ expenses }: { expenses: any[] }) {
  if (!expenses?.length) {
    return <p className="text-gray-500">No hay gastos registrados.</p>;
  }

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Fecha</th>
          <th className="p-2 text-left">Concepto</th>
          <th className="p-2 text-right">Monto</th>
          <th className="p-2 text-left">Método</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((e: any) => (
          <tr key={e.id} className="border-b">
            <td className="p-2">{e.createdAt ? new Date(e.createdAt).toLocaleString() : "-"}</td>
            <td className="p-2">{e.concept ?? e.description ?? "-"}</td>
            <td className="p-2 text-right">{Number(e.amount ?? 0).toFixed(2)}</td>
            <td className="p-2">{e.paymentMethod?.name ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
