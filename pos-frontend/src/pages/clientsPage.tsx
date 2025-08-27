// src/pages/ClientsPage.tsx
import { useEffect, useState } from "react";
import ClientTable from "../components/ClientTable";
import ClientForm from "../components/ClientForm";
import { getClients } from "../services/clientService";
import { useDebounce } from "../hooks/useDebounce"; // usa el hook que ya tienes

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // por ejemplo 20 por página
  const [total, setTotal] = useState<number | null>(null); // si backend devuelve total
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadClients = async (q = debouncedQuery, p = page) => {
    setLoading(true);
    try {
      const res = await getClients({ q: q || undefined, page: p, limit });
      // backend ideally debe devolver { data: [...], total: N } o solo array
      if (res.data && Array.isArray(res.data)) {
        setClients(res.data);
        // si backend incluye total en headers o body, setTotal(...)
        if (res.headers["x-total-count"]) {
          setTotal(Number(res.headers["x-total-count"]));
        } else if ((res.data as any).total !== undefined && Array.isArray((res.data as any).data)) {
          // formato { data: [...], total: 100 }
          setClients((res.data as any).data);
          setTotal((res.data as any).total);
        } else {
          setTotal(null);
        }
      } else {
        // Si backend devuelve { data, total }
        setClients(res.data?.data ?? []);
        setTotal(res.data?.total ?? null);
      }
    } catch (err) {
      console.error("Error cargando clientes", err);
      setClients([]);
      setTotal(null);
    } finally {
      setLoading(false);
    }
  };

  // carga inicial y cada vez que cambie query (debounced) o page
  useEffect(() => {
    setPage(1); // si cambias query, vuelve a página 1
  }, [debouncedQuery]);

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, page]);

  const openNew = () => {
    setSelectedClient(null);
    setShowForm(true);
  };
  const openEdit = (c: any) => {
    setSelectedClient(c);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Clientes</h2>
        <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código, nombre, teléfono, género..."
            className="border p-2 rounded w-80"
          />
          <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded">+ NUEVO</button>
        </div>
      </div>

      <ClientTable
        clients={clients}
        loading={loading}
        onEdit={openEdit}
        onDelete={() => loadClients()}
      />

      {/* paginación simple */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">{total ? `Total: ${total}` : ""}</div>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded">Anterior</button>
          <div className="px-3 py-1 border rounded">Página {page}</div>
          <button disabled={clients.length < limit} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border rounded">Siguiente</button>
        </div>
      </div>

      {showForm && (
        <ClientForm
          client={selectedClient}
          onClose={() => { setShowForm(false); setSelectedClient(null); loadClients(); }}
        />
      )}
    </div>
  );
}
