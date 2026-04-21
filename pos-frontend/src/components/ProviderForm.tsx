import React, { useEffect, useState } from "react";
import { createProvider, updateProvider } from "../services/providerService";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { normalizeCountryCode, normalizePhoneNumber, PHONE_COUNTRIES, validatePhoneInput } from "../utils/phone";

export default function ProviderForm({ provider, onClose }: { provider: any | null; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", country: 'Bolivia', countryCode: '591', phone: "" });
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const { hasPermission } = usePermissions();
  const isEditing = !!provider;

  useEffect(() => {
    if (isEditing && !hasPermission(Permission.PROVIDER_UPDATE)) {
      alert("No tienes permisos para editar proveedores");
      onClose();
      return;
    }
    if (!isEditing && !hasPermission(Permission.PROVIDER_CREATE)) {
      alert("No tienes permisos para crear proveedores");
      onClose();
      return;
    }
  }, [isEditing, hasPermission, onClose]);

  useEffect(() => {
    setForm({
      name: provider?.nombre ?? provider?.name ?? "",
      country: provider?.country ?? 'Bolivia',
      countryCode: provider?.countryCode ?? '591',
      phone: provider?.telefono ?? provider?.phone ?? "",
    });
  }, [provider]);

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
      const payload = {
        name: form.name,
        country: form.country,
        countryCode: normalizeCountryCode(form.countryCode),
        phone: normalizedPhone,
      };

      if (provider && (provider.id_provider ?? provider.id)) {
        await updateProvider(provider.id_provider ?? provider.id, payload);
      } else {
        await createProvider(payload);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? "Error al guardar proveedor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded shadow p-4">
        <h3 className="text-lg font-bold mb-3">{provider ? "Editar proveedor" : "Nuevo proveedor"}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" className="w-full border p-2 rounded" required />
          <div className="grid grid-cols-2 gap-2">
            <select name="country" value={form.country} onChange={handleChange} className="border p-2 rounded" required>
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.name}>{country.name} (+{country.code})</option>
              ))}
            </select>
            <input name="countryCode" value={form.countryCode} onChange={(e) => setForm({ ...form, countryCode: normalizeCountryCode(e.target.value) })} className="border p-2 rounded bg-gray-50" readOnly required />
          </div>
          <input name="phone" value={form.phone} onChange={handleChange} inputMode="numeric" pattern="[0-9]*" placeholder="Teléfono" className="w-full border p-2 rounded" required />
          {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
