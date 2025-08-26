import React, { useEffect, useState } from "react";
import { createClient, updateClient } from "../services/clientService";

export default function ClientForm({ client, onClose }: { client: any | null; onClose: () => void }) {
  const [form, setForm] = useState({
    tipoCliente: client?.tipo_cliente ?? client?.tipoCliente ?? "PERSONA",
    nombre: client?.nombre ?? client?.name ?? "",
    telefono: client?.telefono ?? client?.phone ?? "",
    genero: client?.genero ?? client?.gender ?? "",
    fechaNacimiento: client?.fecha_nacimiento ? new Date(client.fecha_nacimiento).toISOString().slice(0,10) : "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      tipoCliente: client?.tipo_cliente ?? client?.tipoCliente ?? "PERSONA",
      nombre: client?.nombre ?? client?.name ?? "",
      telefono: client?.telefono ?? client?.phone ?? "",
      genero: client?.genero ?? client?.gender ?? "",
      fechaNacimiento: client?.fecha_nacimiento ? new Date(client.fecha_nacimiento).toISOString().slice(0,10) : "",
    });
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        tipoCliente: form.tipoCliente,
        nombre: form.nombre,
        telefono: form.telefono,
        genero: form.genero || null,
        fechaNacimiento: form.fechaNacimiento || null,
      };

      if (client && (client.id_cliente ?? client.id)) {
        await updateClient(client.id_cliente ?? client.id, payload);
      } else {
        await createClient(payload);
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

          <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full border p-2 rounded" required />

          <input name="genero" value={form.genero} onChange={handleChange} placeholder="Género" className="w-full border p-2 rounded" />

          <input name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} placeholder="YYYY-MM-DD" type="date" className="w-full border p-2 rounded" />

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
