import { useEffect, useState } from "react";
import ClientTable from "../components/ClientTable";
import ClientForm from "../components/ClientForm";
import { clientService } from "../services/clientService";
import { useDebounce } from "../hooks/useDebounce";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { PermissionGuard } from "../components/PermissionGuard";
import VisualBranchSelector from "../components/VisualBranchSelector";

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

  const closeHistoryPage = () => {
    setHistoryClient(null);
    setSalesHistory([]);
  };

  if (historyClient) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-700">Historial de compras</h2>
            <p className="text-sm text-gray-500">Cliente: {historyClient.nombre ?? historyClient.name}</p>
          </div>
          <button className="px-3 py-2 border rounded" onClick={closeHistoryPage}>← Volver a clientes</button>
        </div>

        {historyLoading ? <div>Cargando historial...</div> : (
          salesHistory.length ? (
            <div className="space-y-4">
              {salesHistory.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3 text-sm">
                    <div><span className="font-semibold">N° Venta:</span> {sale.saleNumber}</div>
                    <div><span className="font-semibold">Fecha:</span> {new Date(sale.createdAt).toLocaleString()}</div>
                    <div><span className="font-semibold">Total:</span> {sale.total?.toFixed?.(2) ?? sale.total}</div>
                    <div><span className="font-semibold">Estado:</span> {sale.paymentStatus}</div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Productos adquiridos</h4>
                    {sale.items?.length ? (
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="p-2 border text-left">Producto</th>
                            <th className="p-2 border text-left">SKU</th>
                            <th className="p-2 border text-left">Cantidad</th>
                            <th className="p-2 border text-left">Precio Unitario</th>
                            <th className="p-2 border text-left">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="p-2 border">{item.product?.name ?? '-'}</td>
                              <td className="p-2 border">{item.product?.sku ?? '-'}</td>
                              <td className="p-2 border">{item.quantity}</td>
                              <td className="p-2 border">{item.unitPrice}</td>
                              <td className="p-2 border">{item.subtotal}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-gray-500 text-sm">Sin detalle de productos.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-gray-500">Este cliente no tiene ventas registradas.</div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Clientes</h2>
        <div className="flex items-center gap-3">
          <VisualBranchSelector />
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
      {showForm && (
        <ClientForm
          client={selectedClient}
          onClose={() => { setShowForm(false); setSelectedClient(null); loadClients(); }}
        />
      )}
    </div>
  );
}
