import { deleteProvider } from "../services/providerService";
import { useDialog } from "../context/DialogContext";

export default function ProviderTable({
  providers,
  loading,
  onEdit,
  onRefresh,
  canEdit,
  canDelete,
}: {
  providers: any[];
  loading: boolean;
  onEdit: (p: any) => void;
  onRefresh: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { confirm, alert } = useDialog();

  const handleDelete = async (id: number) => {
    const shouldDelete = await confirm({
      title: 'Eliminar proveedor',
      message: '¿Eliminar proveedor?',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!shouldDelete) return;
    try {
      await deleteProvider(id);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar proveedor", 'error');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!providers.length) return <div>No hay proveedores.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 border text-left">Nombre</th>
            <th className="p-3 border text-left">Teléfono</th>
            <th className="p-3 border text-left">Creado</th>
            {(canEdit || canDelete) && <th className="p-3 border text-left">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id_provider ?? p.id ?? p.idProveedor} className="odd:bg-white even:bg-gray-50">
              <td className="p-3 border">{p.nombre ?? p.name}</td>
              <td className="p-3 border">{`+${p.countryCode ?? "591"} ${p.phone ?? p.telefono ?? ""}`}</td>
              <td className="p-3 border">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</td>
              {(canEdit || canDelete) && (
                <td className="p-3 border flex gap-2">
                  {canEdit && (
                    <button onClick={() => onEdit(p)} className="px-2 py-1 bg-yellow-500 text-white rounded">Editar</button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(p.id_provider ?? p.id)} className="px-2 py-1 bg-red-600 text-white rounded">Eliminar</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
