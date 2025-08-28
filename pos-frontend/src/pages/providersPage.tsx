import { useEffect, useState } from "react";
import ProviderTable from "../components/ProviderTable";
import ProviderForm from "../components/ProviderForm";
import { getProviders } from "../services/providerService";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Proveedores</h2>
        <button onClick={() => { setSelected(null); setShowForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded">+ NUEVO</button>
      </div>

      <ProviderTable providers={providers} loading={loading} onEdit={(p)=>{ setSelected(p); setShowForm(true); }} onRefresh={load} />

      {showForm && <ProviderForm provider={selected} onClose={() => { setShowForm(false); load(); }} />}
    </div>
  );
}
