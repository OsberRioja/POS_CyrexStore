import { useState, useEffect } from "react";
import UserTable from "../components/UserTable";
import UserForm from "../components/UserForm";
import { userService } from "../services/userService";
import { useDebounce } from "../hooks/useDebounce";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { PermissionGuard } from "../components/PermissionGuard";
import { useAuth } from "../context/authContext";
import { useBranch } from "../hooks/useBranch";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "SUPERVISOR" | "SELLER">("ALL");

  const { hasPermission } = usePermissions();
  const { currentBranchId } = useAuth(); // ← obtener currentBranchId
  const { branches, currentBranchId: branchId } = useBranch(); // ← usar hook de sucursal

  // Obtener nombre de la sucursal actual
  const currentBranchName = branches.find(b => b.id === branchId)?.name;

  const loadUsers = async () => {
    if(!hasPermission(Permission.USER_READ)) {
      return;
    }

    setLoading(true);
    try {
      const res = await userService.getUsers();
      // Filtrar usuarios por sucursal si no es admin global
      let usersData = res.data || [];
      if (currentBranchId) {
        usersData = usersData.filter((user: any) => user.branchId === currentBranchId);
      }
      setUsers(usersData);
      setFiltered(usersData);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (hasPermission(Permission.USER_READ)){
      loadUsers();
    } 
  }, [currentBranchId]); // ← recargar cuando cambie la sucursal

  useEffect(() => {
    const q = (debouncedQuery || "").trim().toLowerCase();
    if (!q) { setFiltered(users); return; }
    const numeric = /^\d+$/.test(q) ? Number(q) : null;
    const result = users.filter((u) => {
    if (roleFilter !== "ALL") {
      const r = (u.role ?? "").toString().toUpperCase();
      if (r !== roleFilter) return false;
    }
    if (!q) return true;
    const code = (u.userCode ?? u.usercode ?? "").toString().toLowerCase();
    const name = (u.name ?? u.username ?? "").toString().toLowerCase();
    const email = (u.email ?? "").toString().toLowerCase();
    const phone = (u.phone ?? "").toString().toLowerCase();
    if (numeric !== null && code === numeric.toString()) return true;
    if (name.includes(q) || email.includes(q) || phone.includes(q) || code.includes(q)) return true;
    return false;
  });

    setFiltered(result);
  }, [debouncedQuery, users, roleFilter]);

  const handleEdit = (user: any) => {
    if (!hasPermission(Permission.USER_UPDATE)) {
      alert("No tienes permisos para editar usuarios");
      return;
    }
    setSelectedUser(user); 
    setShowForm(true); 
  };

  const handleNew = () => { 
    if (!hasPermission(Permission.USER_CREATE)) {
      alert("No tienes permisos para crear usuarios");
      return;
    }
    setSelectedUser(null); 
    setShowForm(true); 
  };

  if (!hasPermission(Permission.USER_READ)) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                No tienes permisos para acceder a la gestión de usuarios.
                Solo los administradores pueden gestionar usuarios.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-700">Usuarios</h2>
          {/* ← NUEVO: Mostrar sucursal actual */}
          {currentBranchName && (
            <p className="text-sm text-gray-500">
              Sucursal: {currentBranchName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <PermissionGuard permission={Permission.USER_READ}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código, nombre, correo o teléfono"
              className="border p-2 rounded w-80"
            />
          </PermissionGuard>

          <PermissionGuard permission={Permission.USER_READ}>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="border p-2 rounded"
              aria-label="Filtrar por rol"
            >
              <option value="ALL">Todos los roles</option>
              <option value="ADMIN">Administradores</option>
              <option value="SUPERVISOR">Supervisores</option>
              <option value="SELLER">Vendedores</option>
            </select>
          </PermissionGuard>

          <PermissionGuard permission={Permission.USER_CREATE}>
            <button onClick={handleNew} className="bg-blue-600 text-white px-4 py-2 rounded">+ NUEVO</button>
          </PermissionGuard>
        </div>
      </div>

      <UserTable 
        users={filtered} 
        loading={loading} 
        onEdit={handleEdit} 
        onRefresh={loadUsers} 
        canEdit={hasPermission(Permission.USER_UPDATE)}
        canDelete={hasPermission(Permission.USER_DELETE)}
      />

      {showForm && (
        <UserForm user={selectedUser} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadUsers(); }} />
      )}
    </div>
  );
}