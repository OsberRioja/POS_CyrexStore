import React, { useState, useEffect } from "react";
import { createUser, updateUser } from "../services/userService";

export default function UserForm({ user, onClose, onSaved }: { user: any | null; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({
    usercode: user?.userCode ?? user?.usercode ?? "",
    username: user?.name ?? user?.username ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "SELLER",
    password: ""
  });
  const [saving, setSaving] = useState(false);

  // Determinar si estamos editando un usuario existente
  const isEditing = !!(user && user.id);

  useEffect(() => {
    setForm({
      usercode: user?.userCode ?? user?.usercode ?? "",
      username: user?.name ?? user?.username ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      role: user?.role ?? "SELLER",
      password: ""
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role
      };
      // si viene usercode y es number, se lo enviamos (solo para usuarios nuevos)
      if (form.usercode && !isEditing) payload.userCode = Number(form.usercode);
      // si viene contraseña y es nuevo o cambio, la enviamos
      if (form.password) payload.password = form.password;

      if (isEditing) {
        await updateUser(user.id, payload);
      } else {
        await createUser(payload);
      }
      onSaved();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded shadow p-4">
        <h3 className="text-lg font-bold mb-3">{isEditing ? "Editar usuario" : "Nuevo usuario"}</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Campo de código - Solo editable al crear */}
          {isEditing ? (
            <div className="w-full">
              <input 
                name="usercode" 
                value={form.usercode} 
                placeholder="Código de usuario" 
                className="w-full border p-2 rounded bg-gray-100 text-gray-600" 
                disabled
                readOnly
              />
              <small className="text-gray-500 text-xs">El código de usuario no se puede modificar</small>
            </div>
          ) : (
            <input 
              name="usercode" 
              value={form.usercode} 
              onChange={handleChange} 
              placeholder="Código (opcional)" 
              className="w-full border p-2 rounded" 
            />
          )}
          
          <input name="username" value={form.username} onChange={handleChange} placeholder="Nombre" className="w-full border p-2 rounded" required />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Correo" type="email" className="w-full border p-2 rounded" required />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono" className="w-full border p-2 rounded" />
          
          {/* Campo de contraseña - Diferente mensaje según el modo */}
          {isEditing ? (
            <input 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder="Nueva contraseña (dejar vacío para no cambiar)" 
              type="password" 
              className="w-full border p-2 rounded" 
            />
          ) : (
            <input 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder="Contraseña" 
              type="password" 
              className="w-full border p-2 rounded" 
              required 
            />
          )}
          
          <select name="role" value={form.role} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="SELLER">Vendedor</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMIN">Administrador</option>
          </select>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}