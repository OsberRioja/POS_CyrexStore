import { useEffect, useState } from "react";
import ClientTable from "../components/ClientTable";
import ClientForm from "../components/ClientForm";
import { clientService } from "../services/clientService";
import { useDebounce } from "../hooks/useDebounce";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { PermissionGuard } from "../components/PermissionGuard";

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
  const [historyClient, setHistoryClient] = useState<any | null>(null);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { hasPermission, role } = usePermissions();

  const loadClients = async (q = debouncedQuery, p = page) => {
    setLoading(true);
    try {
      const res = await clientService.getClients({ q: q || undefined, page: p, limit });
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



  const openHistory = async (c: any) => {
    setHistoryClient(c);
    setHistoryLoading(true);
    try {
      const res = await clientService.getSales(c.id_cliente ?? c.id ?? c.idCliente);
      setSalesHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error cargando historial", err);
      setSalesHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Clientes</h2>
        <div className="flex items-center gap-3">
          <PermissionGuard permission={Permission.CLIENT_READ}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por código, nombre, teléfono, género..."
              className="border p-2 rounded w-80"
            />
          </PermissionGuard>
          <PermissionGuard permission={Permission.CLIENT_CREATE}>
            <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded">+ NUEVO</button>
          </PermissionGuard>
        </div>
      </div>

      <ClientTable
        clients={clients}
        loading={loading}
        onEdit={openEdit}
        onDelete={() => loadClients()}
        canEdit={hasPermission(Permission.CLIENT_UPDATE)}
        canDelete={hasPermission(Permission.CLIENT_DELETE)}
        canViewHistory={role === "ADMIN" || role === "SUPERVISOR"}
        onViewHistory={openHistory}
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


      {historyClient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-3xl p-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Historial de compras - {historyClient.nombre ?? historyClient.name}</h3>
              <button className="px-2 py-1 border rounded" onClick={() => setHistoryClient(null)}>Cerrar</button>
            </div>
            {historyLoading ? <div>Cargando historial...</div> : (
              salesHistory.length ? (
                <table className="min-w-full text-sm">
                  <thead><tr className="bg-gray-100"><th className="p-2 border text-left">N° Venta</th><th className="p-2 border text-left">Fecha</th><th className="p-2 border text-left">Total</th><th className="p-2 border text-left">Estado</th></tr></thead>
                  <tbody>
                    {salesHistory.map((sale) => (
                      <tr key={sale.id}><td className="p-2 border">{sale.saleNumber}</td><td className="p-2 border">{new Date(sale.createdAt).toLocaleString()}</td><td className="p-2 border">{sale.total?.toFixed?.(2) ?? sale.total}</td><td className="p-2 border">{sale.paymentStatus}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="text-gray-500">Este cliente no tiene ventas registradas.</div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <ClientForm
          client={selectedClient}
          onClose={() => { setShowForm(false); setSelectedClient(null); loadClients(); }}
        />
      )}
    </div>
  );
}
