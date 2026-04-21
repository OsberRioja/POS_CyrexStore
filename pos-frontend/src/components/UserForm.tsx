import React, { useState, useEffect } from "react";
import { userService } from "../services/userService";
import { normalizeCountryCode, normalizePhoneNumber, PHONE_COUNTRIES, validatePhoneInput } from "../utils/phone";

export default function UserForm({ user, onClose, onSaved }: { user: any | null; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({
    usercode: user?.userCode ?? user?.usercode ?? "",
    firstName: user?.firstName ?? "",
    lastNamePaterno: user?.lastNamePaterno ?? "",
    lastNameMaterno: user?.lastNameMaterno ?? "",
    email: user?.email ?? "",
    country: user?.country ?? 'Bolivia',
    countryCode: user?.countryCode ?? '591',
    phone: user?.phone ?? "",
    role: user?.role ?? "SELLER",
    password: ""
  });
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const isEditing = !!(user && user.id);

  useEffect(() => {
    setForm({
      usercode: user?.userCode ?? user?.usercode ?? "",
      firstName: user?.firstName ?? "",
      lastNamePaterno: user?.lastNamePaterno ?? "",
      lastNameMaterno: user?.lastNameMaterno ?? "",
      email: user?.email ?? "",
      country: user?.country ?? 'Bolivia',
      countryCode: user?.countryCode ?? '591',
      phone: user?.phone ?? "",
      role: user?.role ?? "SELLER",
      password: ""
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const normalized = normalizePhoneNumber(value);
      setForm({ ...form, phone: normalized });
      setPhoneError(validatePhoneInput(normalized));
      return;
    }
    if (name === 'country') {
      const selected = PHONE_COUNTRIES.find((c) => c.name === value);
      setForm({ ...form, country: value, countryCode: selected?.code ?? form.countryCode });
      return;
    }
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizePhoneNumber(form.phone);
    const error = validatePhoneInput(normalizedPhone);
    setPhoneError(error);
    if (error) return;

    setSaving(true);
    try {
      const payload: any = {
        firstName: form.firstName.trim(),
        lastNamePaterno: form.lastNamePaterno.trim(),
        lastNameMaterno: form.lastNameMaterno.trim(),
        email: form.email,
        country: form.country,
        countryCode: normalizeCountryCode(form.countryCode),
        phone: normalizedPhone,
        role: form.role
      };

      if (form.usercode && !isEditing) payload.userCode = Number(form.usercode);
      if (isEditing && form.password) payload.password = form.password;

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
        <h3 className="text-lg font-bold mb-3">{isEditing ? "Editar usuario" : "Nuevo usuario"}</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input name="usercode" value={form.usercode} onChange={handleChange} placeholder="Código" className="w-full border p-2 rounded" disabled={isEditing} />
          <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="Nombre" className="w-full border p-2 rounded" required />
          <input name="lastNamePaterno" value={form.lastNamePaterno} onChange={handleChange} placeholder="Apellido paterno" className="w-full border p-2 rounded" required />
          <input name="lastNameMaterno" value={form.lastNameMaterno} onChange={handleChange} placeholder="Apellido materno" className="w-full border p-2 rounded" required />
          <input name="email" value={form.email} onChange={handleChange} placeholder="Correo electrónico" type="email" className="w-full border p-2 rounded" required />

          <div className="grid grid-cols-2 gap-2">
            <select name="country" value={form.country} onChange={handleChange} className="border p-2 rounded" required>
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.name}>{country.name} (+{country.code})</option>
              ))}
            </select>
            <input name="countryCode" value={form.countryCode} className="border p-2 rounded bg-gray-50" readOnly required />
          </div>

          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono" inputMode="numeric" pattern="[0-9]*" className="w-full border p-2 rounded" required />
          {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}

          {isEditing && <input name="password" value={form.password} onChange={handleChange} placeholder="Nueva contraseña (opcional)" type="password" className="w-full border p-2 rounded" />}

          <select name="role" value={form.role} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="ADMIN">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="SELLER">Vendedor</option>
          </select>

          <div className="flex justify-end gap-2 mt-3">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-1 bg-green-600 text-white rounded disabled:opacity-50">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
