import React, { useEffect, useState } from "react";
import { clientService } from "../services/clientService";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { normalizeCountryCode, normalizePhoneNumber, PHONE_COUNTRIES, validatePhoneInput } from "../utils/phone";

export default function ClientForm({ client, onClose, onSaved }: { client: any | null; onClose: () => void; onSaved?: (createdClient: any) => void }) {
  const [form, setForm] = useState({
    tipoCliente: client?.tipo_cliente ?? client?.tipoCliente ?? "PERSONA",
    nombre: client?.nombre ?? client?.name ?? "",
    country: client?.country ?? "Bolivia",
    countryCode: client?.countryCode ?? "591",
    phone: client?.phone ?? client?.telefono ?? client?.countryCode ?? "",
    genero: client?.genero ?? client?.gender ?? "",
    fechaNacimiento: client?.fecha_nacimiento ? new Date(client.fecha_nacimiento).toISOString().slice(0, 10) : "",
  });
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const { hasPermission } = usePermissions();
  const isEditing = !!client;

  useEffect(() => {
    if (isEditing && !hasPermission(Permission.CLIENT_UPDATE)) {
      alert("No tienes permiso para editar clientes.");
      onClose();
      return;
    }

    if (!isEditing && !hasPermission(Permission.CLIENT_CREATE)) {
      alert("No tienes permiso para crear clientes.");
      onClose();
      return;
    }
  }, [isEditing, hasPermission, onClose]);

  useEffect(() => {
    setForm({
      tipoCliente: client?.tipo_cliente ?? client?.tipoCliente ?? "PERSONA",
      nombre: client?.nombre ?? client?.name ?? "",
      country: client?.country ?? "Bolivia",
      countryCode: client?.countryCode ?? "591",
      phone: client?.phone ?? client?.telefono ?? "",
      genero: normalizeGenero(client?.genero ?? client?.gender ?? ""),
      fechaNacimiento: client?.fecha_nacimiento ? new Date(client.fecha_nacimiento).toISOString().slice(0, 10) : "",
    });
  }, [client]);

  function normalizeGenero(raw: string | undefined | null) {
    if (!raw) return "";
    const s = String(raw).trim().toLowerCase();
    if (s === "m" || s === "masculino" || s.startsWith("masc")) return "Masculino";
    if (s === "f" || s === "femenino" || s.startsWith("fem")) return "Femenino";
    return "Otro";
  }

  const generoMap: Record<string, string> = {
    F: "Femenino",
    M: "Masculino",
    O: "Otro",
  };

  const handleSelectGenero = (value: string) => {
    const texto = generoMap[value] ?? "Otro";
    setForm({ ...form, genero: texto });
  };

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

    if (name === 'countryCode') {
      setForm({ ...form, countryCode: normalizeCountryCode(value) });
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

    if (!form.country || !form.countryCode) {
      alert('País y código de país son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        tipoCliente: form.tipoCliente,
        nombre: form.nombre,
        country: form.country,
        countryCode: normalizeCountryCode(form.countryCode),
        phone: normalizedPhone,
        genero: form.genero || null,
        fechaNacimiento: form.fechaNacimiento || null,
      };

      if (client && (client.id_cliente ?? client.id)) {
        const res = await clientService.update(client.id_cliente ?? client.id, payload);
        onSaved && onSaved(res.data);
      } else {
        const res = await clientService.create(payload);
        onSaved && onSaved(res.data);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded shadow p-4">
        <h3 className="text-lg font-bold mb-3">{client ? "Editar cliente" : "Nuevo cliente"}</h3>
        <form onSubmit={handleSubmit} className="space-y-2">
          <select name="tipoCliente" value={form.tipoCliente} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="PERSONA">Persona</option>
            <option value="EMPRESA">Empresa</option>
          </select>

          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="w-full border p-2 rounded" required />

          <div className="grid grid-cols-2 gap-2">
            <select name="country" value={form.country} onChange={handleChange} className="border p-2 rounded" required>
              {PHONE_COUNTRIES.map((country) => (
                <option key={country.code} value={country.name}>{country.name} (+{country.code})</option>
              ))}
            </select>
            <input name="countryCode" value={form.countryCode} onChange={handleChange} className="border p-2 rounded bg-gray-50" required readOnly />
          </div>

          <input name="phone" value={form.phone} onChange={handleChange} inputMode="numeric" pattern="[0-9]*" placeholder="Teléfono (solo números)" className="w-full border p-2 rounded" required />
          {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}

          <div className="flex gap-2">
            <select
              name="generoSelect"
              value={(() => {
                const g = form.genero ? form.genero.toLowerCase() : "";
                if (g === "masculino") return "M";
                if (g === "femenino") return "F";
                if (g === "otro") return "O";
                return "";
              })()}
              onChange={(e) => handleSelectGenero(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Seleccionar género</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="O">Otro</option>
            </select>

            <input name="genero" value={form.genero} readOnly placeholder="Género" className="flex-1 border p-2 rounded bg-gray-50" />
          </div>

          <input name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} type="date" className="w-full border p-2 rounded" />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
