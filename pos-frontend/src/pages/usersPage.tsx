import { useState, useEffect } from "react";
import UserTable from "../components/UserTable";
import UserForm from "../components/UserForm";
import { getUsers } from "../services/userService";
import { useDebounce } from "../hooks/useDebounce";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

    useEffect(() => {
    // aplica el filtrado localmente cuando cambia la query (debounced)
    const q = (debouncedQuery || "").trim().toLowerCase();
    if (!q) { setFiltered(users); return; }

    const numeric = /^\d+$/.test(q) ? Number(q) : null;

    const result = users.filter((u) => {
      // normalizar campos
      const code = (u.userCode ?? u.usercode ?? "").toString().toLowerCase();
      const name = (u.name ?? u.username ?? "").toString().toLowerCase();
      const email = (u.email ?? "").toString().toLowerCase();
      const phone = (u.phone ?? "").toString().toLowerCase();

      if (numeric !== null && code === numeric.toString()) return true;
      // contains for others
      if (name.includes(q) || email.includes(q) || phone.includes(q) || code.includes(q)) return true;
      return false;
    });

    setFiltered(result);
  }, [debouncedQuery, users]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Usuarios</h2>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, nombre, correo o teléfono"
            className="border p-2 rounded w-80"
          />
          <button onClick={() => { setSelectedUser(null); setShowForm(true); }} className="bg-blue-600 text-white px-4 py-2 rounded">+ NUEVO</button>
        </div>
      </div>

      <UserTable users={filtered} loading={loading} onEdit={(u)=> { setSelectedUser(u); setShowForm(true); }} onRefresh={loadUsers} />

      {showForm && (
        <UserForm user={selectedUser} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); loadUsers(); }} />
      )}
    </div>
  );
}
