export default function PaymentMethodTable({
  methods,
  onEdit,
  onDelete,
}: {
  methods: { id: number; name: string; isCash: boolean; total?: number }[];
  onEdit: (m: any) => void;
  onDelete: (id: number) => void;
}) {
  if (!methods?.length) return <p className="text-gray-500">No hay métodos de pago.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border text-left">Nombre</th>
            <th className="p-2 border text-left">¿Efectivo?</th>
            <th className="p-2 border text-right">Ingresos en caja</th>
            <th className="p-2 border">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {methods.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="p-2">{m.name}</td>
              <td className="p-2">{m.isCash ? "Sí" : "No"}</td>
              <td className="p-2 text-right">{(m.total ?? 0).toFixed(2)}</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button onClick={() => onEdit(m)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Editar</button>
                  <button onClick={() => onDelete(m.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Eliminar</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
