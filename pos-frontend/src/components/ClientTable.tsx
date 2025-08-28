import { deleteClient } from "../services/clientService";

export default function ClientTable({
  clients,
  loading,
  onEdit,
  onDelete,
}: {
  clients: any[];
  loading: boolean;
  onEdit: (c: any) => void;
  onDelete: () => void;
}) {
  const handleDelete = async (id: number) => {
    if (!confirm("Eliminar cliente?")) return;
    try {
      await deleteClient(id);
      onDelete();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar");
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!clients.length) return <div className="text-gray-500">No hay clientes.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            {/* <th className="p-3 border text-left">ID</th> */}
            <th className="p-3 border text-left">Tipo</th>
            <th className="p-3 border text-left">Nombre</th>
            <th className="p-3 border text-left">Teléfono</th>
            <th className="p-3 border text-left">Género</th>
            <th className="p-3 border text-left">Fecha Nac.</th>
            <th className="p-3 border text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id_cliente ?? c.id ?? c.idCliente}>
              {/* <td className="p-3 border font-semibold">{c.id_cliente ?? c.id ?? c.idCliente}</td> */}
              <td className="p-3 border">{(c.tipo_cliente ?? c.tipoCliente ?? "").toString()}</td>
              <td className="p-3 border">{c.nombre ?? c.name ?? c.nombre}</td>
              <td className="p-3 border">{c.telefono ?? c.phone}</td>
              <td className="p-3 border">{c.genero ?? c.gender ?? "-"}</td>
              <td className="p-3 border">{c.fecha_nacimiento ? new Date(c.fecha_nacimiento).toLocaleDateString() : "-"}</td>
              <td className="p-3 border flex gap-2">
                <button onClick={() => onEdit(c)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Editar</button>
                <button onClick={() => handleDelete(c.id_cliente ?? c.id ?? c.idCliente)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
