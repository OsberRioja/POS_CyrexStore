import React, { useEffect, useState } from "react";
import { createProvider, updateProvider } from "../services/providerService";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";

export default function ProviderForm({ provider, onClose }: { provider: any | null; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const { hasPermission } = usePermissions();
  const isEditing = !!provider;

  // Verificar permisos al cargar
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
      phone: provider?.telefono ?? provider?.phone ?? "",
    });
  }, [provider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (provider && (provider.id_provider ?? provider.id)) {
        await updateProvider(provider.id_provider ?? provider.id, form);
      } else {
        await createProvider(form);
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
        <h3 className="text-lg font-bold mb-3">
          {provider ? "Editar proveedor" : "Nuevo proveedor"}
          {!hasPermission(Permission.PROVIDER_UPDATE) &&  provider && (
            <span className="text-xs text-red-600 ml-2">(SOLO LECTURA)</span>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" 
            className="w-full border p-2 rounded" required
            disabled={isEditing && !hasPermission(Permission.PROVIDER_UPDATE)}
          />
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono" 
            className="w-full border p-2 rounded" required
            disabled={isEditing && !hasPermission(Permission.PROVIDER_UPDATE)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancelar</button>
            {(isEditing ? hasPermission(Permission.PROVIDER_UPDATE) : hasPermission(Permission.PROVIDER_CREATE)) && (
              <button type="submit" disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded"
              >
                {saving ? "Guardando..." : "Guardar"}</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
