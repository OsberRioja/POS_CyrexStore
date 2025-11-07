import { useEffect, useState } from "react";
import ProviderTable from "../components/ProviderTable";
import ProviderForm from "../components/ProviderForm";
import { getProviders } from "../services/providerService";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { PermissionGuard } from "../components/PermissionGuard";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { hasPermission } = usePermissions();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProviders();
      setProviders(res.data ?? []);
    } catch (err) {
      console.error(err);
      setProviders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    //solo cargar si el usuario tiene permisos de lectura
    if (hasPermission(Permission.PROVIDER_READ)) {
      load();
    } 
  }, []);

  // Si el usuario no tiene permisos, mostrar mensaje
  if (!hasPermission(Permission.PROVIDER_READ)){
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                No tienes permisos para acceder a esta sección.
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
        <h2 className="text-xl font-semibold">Proveedores</h2>
        <PermissionGuard permission={Permission.PROVIDER_CREATE}>
          <button onClick={() => { setSelected(null); setShowForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded">+ NUEVO</button>
        </PermissionGuard>
      </div>

      <ProviderTable 
        providers={providers} 
        loading={loading} 
        onEdit={(p)=>{ setSelected(p); setShowForm(true); }} 
        onRefresh={load} 
        canEdit={hasPermission(Permission.PROVIDER_UPDATE)}
        canDelete={hasPermission(Permission.PROVIDER_DELETE)}
      />

      {showForm && <ProviderForm provider={selected} onClose={() => { setShowForm(false); load(); }} />}
    </div>
  );
}
