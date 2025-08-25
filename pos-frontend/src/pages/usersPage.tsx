import React, { useState, useEffect } from "react";
import UserTable from "../components/UserTable";
import UserForm from "../components/UserForm";
import { getUsers } from "../services/userService";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Usuarios</h2>

        <div className="flex items-center gap-3">
          {/* pestañas simples (puedes añadir más) */}
          <div className="flex gap-2 items-center">
            {/* <button className="px-3 py-1 text-sm text-gray-600 border rounded">Listado</button>
            <button className="px-3 py-1 text-sm text-gray-600 border rounded">Roles</button> */}
          </div>

          <button
            onClick={() => { setSelectedUser(null); setShowForm(true); }}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md shadow"
          >
            + NUEVO
          </button>
        </div>
      </div>

      <UserTable users={users} loading={loading} onEdit={(u)=> { setSelectedUser(u); setShowForm(true); }} onRefresh={loadUsers} />

      {showForm && (
        <UserForm
          user={selectedUser}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadUsers(); }}
        />
      )}
    </div>
  );
}
