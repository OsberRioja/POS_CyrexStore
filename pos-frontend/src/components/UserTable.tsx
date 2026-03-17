import { userService } from "../services/userService";

export default function UserTable({
  users,
  loading,
  onEdit,
  onRefresh,
  canEdit,
  canDelete,
}: {
  users: any[];
  loading: boolean;
  onEdit: (u: any) => void;
  onRefresh: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert("No tienes permisos para eliminar usuarios");
      return;
    }

    if (!confirm("¿Estas Seguro de Querer Eliminar Este usuario?")) return;

    try {
      await userService.delete(id);
      onRefresh();
    } catch(error) {
      console.error(error);
      alert("Error al eliminar el usuario");
    }
  };

  const getCode = (u: any) => u.userCode ?? u.usercode ?? u.user_code ?? u.code ?? "-";

  const getDisplayName = (u: any) => {
    const normalized = [u.firstName, u.lastNamePaterno, u.lastNameMaterno]
      .filter(Boolean)
      .join(' ')
      .trim();
    return normalized || (u.name ?? u.username ?? u.userName);
  };

  if (loading) return <div>Cargando...</div>;
  if (!users.length) return <div className="text-gray-500">No hay usuarios.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 border text-left">Código</th>
            <th className="p-3 border text-left">Nombre</th>
            <th className="p-3 border text-left">Correo</th>
            <th className="p-3 border text-left">Teléfono</th>
            <th className="p-3 border text-left">Rol</th>
            {(canEdit || canDelete) && <th className="p-3 border text-left">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id ?? getCode(u)} className="odd:bg-white even:bg-gray-50">
              <td className="p-3 border font-semibold">{getCode(u)}</td>
              <td className="p-3 border">{getDisplayName(u)}</td>
              <td className="p-3 border">{u.email}</td>
              <td className="p-3 border">{u.phone}</td>
              <td className="p-3 border">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                  u.role === 'SUPERVISOR' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                  }`}>
                    {u.role}
                </span>
              </td>
              {(canEdit || canDelete) &&(
                <td className="p-3 border flex gap-2">
                  {canEdit && (
                    <button onClick={() => onEdit(u)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Editar</button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(u.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Eliminar</button>
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
