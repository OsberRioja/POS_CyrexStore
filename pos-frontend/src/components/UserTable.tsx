import React from "react";
import { deleteUser } from "../services/userService";

export default function UserTable({
  users,
  loading,
  onEdit,
  onRefresh,
}: {
  users: any[];
  loading: boolean;
  onEdit: (u: any) => void;
  onRefresh: () => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar usuario?")) return;
    await deleteUser(id);
    onRefresh();
  };

  const getCode = (u: any) => u.userCode ?? u.usercode ?? u.user_code ?? u.code ?? "-";

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
            <th className="p-3 border text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id ?? getCode(u)} className="odd:bg-white even:bg-gray-50">
              <td className="p-3 border font-semibold">{getCode(u)}</td>
              <td className="p-3 border">{u.name ?? u.username ?? u.userName}</td>
              <td className="p-3 border">{u.email}</td>
              <td className="p-3 border">{u.phone}</td>
              <td className="p-3 border">{u.role}</td>
              <td className="p-3 border flex gap-2">
                <button onClick={() => onEdit(u)} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">Editar</button>
                <button onClick={() => handleDelete(u.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
