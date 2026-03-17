import React, { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";

export default function UserForm({ user, onClose, onSaved }: { user: any | null; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({
    usercode: user?.userCode ?? user?.usercode ?? "",
    firstName: user?.firstName ?? "",
    lastNamePaterno: user?.lastNamePaterno ?? "",
    lastNameMaterno: user?.lastNameMaterno ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "SELLER",
    password: ""
  });
  const [saving, setSaving] = useState(false);

  const { hasPermission } = usePermissions();
  const isEditing = !!(user && user.id);

  useEffect(() => {
    if (isEditing && !hasPermission(Permission.USER_UPDATE)) {
      alert("No tienes permisos para editar usuarios");
      onClose();
      return;
    }
    if (!isEditing && !hasPermission(Permission.USER_CREATE)) {
      alert("No tienes permisos para crear usuarios");
      onClose();
      return;
    }
  }, [isEditing, hasPermission, onClose]);

  useEffect(() => {
    setForm({
      usercode: user?.userCode ?? user?.usercode ?? "",
      firstName: user?.firstName ?? "",
      lastNamePaterno: user?.lastNamePaterno ?? "",
      lastNameMaterno: user?.lastNameMaterno ?? "",
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

    if (isEditing && !hasPermission(Permission.USER_UPDATE)) {
      alert("No tienes permisos para editar usuarios");
      return;
    }

    if (!isEditing && !hasPermission(Permission.USER_CREATE)) {
      alert("No tienes permisos para crear usuarios");
      return;
    }

    if (!form.firstName.trim() || !form.lastNamePaterno.trim() || !form.lastNameMaterno.trim()) {
      alert("Nombre, apellido paterno y apellido materno son requeridos");
      return;
    }

    if (!form.email || !form.email.includes('@')) {
      alert("Por favor ingresa un email válido");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        firstName: form.firstName.trim(),
        lastNamePaterno: form.lastNamePaterno.trim(),
        lastNameMaterno: form.lastNameMaterno.trim(),
        email: form.email,
        phone: form.phone,
        role: form.role
      };

      if (form.usercode && !isEditing) {
        payload.userCode = Number(form.usercode);
      }

      if (isEditing && form.password) {
        payload.password = form.password;
      }

      if (isEditing) {
        await userService.update(user.id, payload);
      } else {
        await userService.create(payload);
      }
      onSaved();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? err?.response?.data?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded shadow p-4">
        <h3 className="text-lg font-bold mb-3">
          {isEditing ? "Editar usuario" : "Nuevo usuario"}
          {!hasPermission(Permission.USER_UPDATE) && isEditing && (
            <span className="text-xs text-red-600 ml-2">(SOLO LECTURA)</span>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-2">
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
              placeholder="Código (opcional - se generará automáticamente si está vacío)"
              className="w-full border p-2 rounded"
            />
          )}

          <input
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="Nombre"
            className="w-full border p-2 rounded"
            required
            disabled={isEditing && !hasPermission(Permission.USER_UPDATE)}
          />
          <input
            name="lastNamePaterno"
            value={form.lastNamePaterno}
            onChange={handleChange}
            placeholder="Apellido paterno"
            className="w-full border p-2 rounded"
            required
            disabled={isEditing && !hasPermission(Permission.USER_UPDATE)}
          />
          <input
            name="lastNameMaterno"
            value={form.lastNameMaterno}
            onChange={handleChange}
            placeholder="Apellido materno"
            className="w-full border p-2 rounded"
            required
            disabled={isEditing && !hasPermission(Permission.USER_UPDATE)}
          />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Correo electrónico"
            type="email"
            className="w-full border p-2 rounded"
            required
            disabled={isEditing && !hasPermission(Permission.USER_UPDATE)}
          />
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Teléfono"
            className="w-full border p-2 rounded"
            disabled={isEditing && !hasPermission(Permission.USER_UPDATE)}
          />

          {isEditing ? (
            <div>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                type="password"
                className="w-full border p-2 rounded"
                disabled={!hasPermission(Permission.USER_UPDATE)}
              />
            </div>
          ) : (
            <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              <strong>Nota:</strong> La contraseña se generará automáticamente y se enviará por email al usuario.
            </p>
          )}

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            disabled={isEditing && !hasPermission(Permission.USER_UPDATE)}
          >
            <option value="ADMIN">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="SELLER">Vendedor</option>
          </select>

          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
            <button
              type="submit"
              disabled={saving || (isEditing && !hasPermission(Permission.USER_UPDATE))}
              className="px-4 py-1 bg-green-600 text-white rounded disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
