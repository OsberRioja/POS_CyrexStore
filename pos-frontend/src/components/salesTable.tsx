// src/components/SalesTable.tsx
export default function SalesTable({ sales }: { sales: any[] }) {
  if (!sales?.length) {
    return <p className="text-gray-500">No hay ventas registradas.</p>;
  }

  return (
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="p-2 text-left">Fecha</th>
          <th className="p-2 text-left">Items</th>
          <th className="p-2 text-right">Monto</th>
          <th className="p-2 text-left">Vendedor</th>
        </tr>
      </thead>
      <tbody>
        {sales.map((s: any) => (
          <tr key={s.id} className="border-b">
            <td className="p-2">{s.createdAt ? new Date(s.createdAt).toLocaleString() : "-"}</td>
            <td className="p-2">{(s.items ?? []).length}</td>
            <td className="p-2 text-right">{Number(s.total ?? 0).toFixed(2)}</td>
            <td className="p-2">{s.seller?.name ?? s.sellerName ?? s.sellerId ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
