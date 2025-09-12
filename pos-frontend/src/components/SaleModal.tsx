// src/components/SaleFormModal.tsx
import React, { useEffect, useState } from "react";
import { productService } from "../services/productService";
import { clientService } from "../services/clientService";
import { userService } from "../services/userService";
import { paymentMethodService } from "../services/paymentMethodService";
import { saleService } from "../services/saleService";
import ClientForm from "./ClientForm"; // usamos el formulario completo de cliente

type Item = { productId: string; name: string; qty: number; unitPrice: number; subtotal: number };
type Payment = { paymentMethodId: number; amount: number };

export default function SaleFormModal({
  cashBoxId,
  token,
  onClose,
  onSuccess,
}: {
  cashBoxId: number;
  token?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [queryProduct, setQueryProduct] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // clientes
  const [clientQuery, setClientQuery] = useState("");
  const [clientsResults, setClientsResults] = useState<any[]>([]);
  const [clientSelected, setClientSelected] = useState<any | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);

  // vendedor
  const [sellerQuery, setSellerQuery] = useState("");
  const [sellerResults, setSellerResults] = useState<any[]>([]);
  const [sellerSelected, setSellerSelected] = useState<any | null>(null);

  // pagos
  const [methods, setMethods] = useState<any[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // UI
  const [saving, setSaving] = useState(false);

  // cargar métodos de pago
  useEffect(() => {
    (async () => {
      try {
        const r = await paymentMethodService.list();
        setMethods(r.data ?? []);
      } catch (err) {
        console.error(err);
        setMethods([]);
      }
    })();
  }, []);

  // búsqueda productos (debounce simple)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!queryProduct.trim()) {
        setProductResults([]);
        return;
      }
      try {
        const r = await productService.search({ q: queryProduct });
        setProductResults(r.data ?? []);
      } catch (err) {
        console.error(err);
        setProductResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [queryProduct]);

  // búsqueda clientes (debounce)
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = clientQuery.trim();
      if (!q) {
        setClientsResults([]);
        return;
      }
      try {
        const r = await clientService.search({ q });
        // backend devuelve { data, total } o array
        const data = Array.isArray(r.data) ? r.data : r.data?.data ?? r.data ?? [];
        setClientsResults(data);
      } catch (err) {
        console.error(err);
        setClientsResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [clientQuery]);

  // búsqueda vendedores por nombre o codigo
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = sellerQuery.trim();
      if (!q) {
        setSellerResults([]);
        return;
      }
      try {
        // userService.getUsers acepta q opcional (ya lo tienes implementado)
        const r = await userService.getUsers(q);
        const data = Array.isArray(r.data) ? r.data : r.data?.data ?? r.data ?? [];
        setSellerResults(data);
      } catch (err) {
        console.error("buscar vendedores:", err);
        setSellerResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [sellerQuery]);

  const addProduct = (p: any) => {
    const unit = p.salePrice ?? p.sale_price ?? p.salePrice ?? 0;
    const it: Item = { productId: p.id, name: p.name, qty: 1, unitPrice: Number(unit), subtotal: Number(unit) };
    setItems((s) => [...s, it]);
    setQueryProduct("");
    setProductResults([]);
  };

  const changeQty = (idx: number, qty: number) => {
    if (qty < 1) qty = 1;
    setItems((s) => s.map((it, i) => (i === idx ? { ...it, qty, subtotal: Math.round(it.unitPrice * qty * 100) / 100 } : it)));
  };

  const removeItem = (idx: number) => setItems((s) => s.filter((_, i) => i !== idx));

  const total = items.reduce((a, i) => a + i.subtotal, 0);
  const paymentsSum = payments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const remaining = Math.max(0, Math.round((total - paymentsSum) * 100) / 100);
  const change = Math.max(0, Math.round((paymentsSum - total) * 100) / 100);
  const isPartial = paymentsSum < total;

  const searchClients = async (q: string) => {
    setClientQuery(q);
  };

  const handleClientSelect = (c: any) => {
    setClientSelected(c);
    setClientsResults([]);
    setClientQuery(c.nombre ?? c.name ?? "");
  };

  const handleSellerSelect = (u: any) => {
    setSellerSelected(u);
    setSellerResults([]);
    setSellerQuery(u.name ?? u.username ?? `${u.name} (${u.userCode ?? ""})`);
  };

  // crear cliente usando ClientForm (usa onSaved)
  const handleClientCreated = (createdClient: any) => {
    setClientSelected(createdClient);
    setClientQuery(createdClient.nombre ?? createdClient.name ?? "");
    setShowClientForm(false);
  };

  const handleCreateClientNow = async () => {
    // abrir formulario completo
    setShowClientForm(true);
  };

  const handleSellerByCode = async () => {
    if (!sellerQuery) return;
    // si el usuario escribió sólo el código, buscar por usercode
    const maybeNum = Number(sellerQuery);
    if (!Number.isNaN(maybeNum)) {
      try {
        const r = await userService.getByUsercode(maybeNum);
        if (r?.data) {
          handleSellerSelect(r.data);
        } else {
          alert("Vendedor no encontrado por código");
        }
      } catch (err) {
        console.error(err);
        alert("Vendedor no encontrado por código");
      }
    } else {
      // si escribió texto, dejamos que la búsqueda por nombre la haga el efecto
    }
  };

  const addPayment = (pmId: number, amount: number) => {
    if (!pmId || Number.isNaN(amount) || amount <= 0) return alert("Monto inválido");
    setPayments((s) => [...s, { paymentMethodId: pmId, amount }]);
  };

  const removePayment = (idx: number) => setPayments((s) => s.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientSelected) {
      return alert("Selecciona o crea un cliente para continuar");
    }
    if (items.length === 0) return alert("Agrega al menos 1 producto");
    if (payments.length === 0) {
      // permitimos venta sin pagos? preferible exigir al menos 1 pago (si usan anticipos, el pago puede ser parcial)
      return alert("Agrega al menos 1 pago (puede ser anticipo)");
    }

    const payload: any = {
      sellerUserCode: sellerSelected ? sellerSelected.userCode : undefined,
      sellerId: sellerSelected ? sellerSelected.id : undefined,
      client: { id_cliente: clientSelected.id_cliente },
      items: items.map((it) => ({ productId: it.productId, quantity: it.qty, unitPrice: it.unitPrice })),
      payments: payments.map((p) => ({ paymentMethodId: p.paymentMethodId, amount: p.amount })),
      cashBoxId,
    };

    setSaving(true);
    try {
      await saleService.create(payload);
      onSuccess();
    } catch (err: any) {
      console.error("sale create:", err?.response?.data ?? err.message ?? err);
      const resp = err?.response;
      alert("Error guardando venta. Status: " + (resp?.status ?? "??") + "\nBody: " + JSON.stringify(resp?.data ?? err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[1000px] rounded shadow p-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Nueva Venta</h3>
          <button onClick={onClose} className="px-2 py-1 border rounded">
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* VENDEDOR */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm">Vendedor (nombre o código)</label>
              <div className="flex gap-2">
                <input
                  placeholder="Buscar vendedor por nombre o código"
                  value={sellerQuery}
                  onChange={(e) => setSellerQuery(e.target.value)}
                  className="border p-2 rounded flex-1"
                />
                <button type="button" onClick={handleSellerByCode} className="px-3 py-2 bg-gray-800 text-white rounded">
                  Buscar
                </button>
              </div>

              {/* lista de resultados por nombre */}
              {sellerResults.length > 0 && (
                <div className="border rounded mt-1 max-h-32 overflow-auto bg-white z-50">
                  {sellerResults.map((u) => (
                    <div
                      key={u.id}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSellerSelect(u)}
                    >
                      {u.name} — {u.email} — {u.userCode ?? ""}
                    </div>
                  ))}
                </div>
              )}

              {sellerSelected && <div className="text-sm mt-1 text-gray-600">Seleccionado: {sellerSelected.name}</div>}
            </div>

            {/* CLIENTE */}
            <div>
              <label className="text-sm">Cliente</label>
              <input
                placeholder="Buscar cliente..."
                value={clientQuery}
                onChange={(e) => searchClients(e.target.value)}
                className="border p-2 rounded w-full"
              />
              {clientsResults.length > 0 && (
                <div className="border rounded mt-1 max-h-32 overflow-auto bg-white z-50">
                  {clientsResults.map((c: any) => (
                    <div
                      key={c.id_cliente}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleClientSelect(c)}
                    >
                      {c.nombre} — {c.telefono}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 flex gap-2">
                <button type="button" onClick={handleCreateClientNow} className="px-3 py-1 bg-green-600 text-white rounded">
                  Crear cliente
                </button>
                <div className="text-sm mt-1">{clientSelected ? `Cliente: ${clientSelected.nombre}` : ""}</div>
              </div>
            </div>

            {/* PAYMENT METHODS (summary) */}
            <div>
              <label className="text-sm">Métodos de pago</label>
              <div className="flex gap-2 items-center mt-1">
                <select id="pm-select" className="border p-2 rounded flex-1">
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input id="pm-amt" placeholder="monto" className="border p-2 rounded w-28" />
                <button
                  type="button"
                  onClick={() => {
                    const sel = (document.getElementById("pm-select") as HTMLSelectElement).value;
                    const amt = Number((document.getElementById("pm-amt") as HTMLInputElement).value);
                    addPayment(Number(sel), amt);
                    (document.getElementById("pm-amt") as HTMLInputElement).value = "";
                  }}
                  className="px-2 py-1 bg-indigo-600 text-white rounded"
                >
                  Añadir
                </button>
              </div>
              <div className="mt-2">
                {payments.map((p, i) => (
                  <div key={i} className="text-sm flex justify-between items-center">
                    <div>
                      {methods.find((m) => m.id === p.paymentMethodId)?.name ?? p.paymentMethodId}: {Number(p.amount).toFixed(2)}
                    </div>
                    <div>
                      <button type="button" onClick={() => removePayment(i)} className="px-2 py-1 text-sm border rounded">
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* PRODUCT SEARCH + ITEMS */}
          <div>
            <label className="text-sm">Buscar producto</label>
            <div className="flex gap-2 mt-1">
              <input value={queryProduct} onChange={(e) => setQueryProduct(e.target.value)} placeholder="Nombre o SKU" className="border p-2 rounded flex-1" />
              <div className="w-36 flex-none text-right text-sm text-gray-500 pt-2">total: {total.toFixed(2)}</div>
            </div>

            {productResults.length > 0 && (
              <div className="border rounded mt-1 max-h-40 overflow-auto bg-white">
                {productResults.map((p) => (
                  <div key={p.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => addProduct(p)}>
                    {p.name} — {Number(p.salePrice ?? p.sale_price ?? 0).toFixed(2)}
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-2">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Producto</th>
                      <th className="p-2">Cant.</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">
                          <input type="number" value={it.qty} min={1} onChange={(e) => changeQty(idx, Number(e.target.value))} className="w-20 border p-1 rounded" />
                        </td>
                        <td className="p-2 text-right">{it.subtotal.toFixed(2)}</td>
                        <td className="p-2">
                          <button type="button" onClick={() => removeItem(idx)} className="px-2 py-1 bg-red-500 text-white rounded">
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* resumen de pagos */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className={`px-3 py-2 rounded ${isPartial ? "bg-red-100 text-red-800" : "bg-green-50 text-green-800"}`}>
                <div>Total: <b>{total.toFixed(2)}</b></div>
                <div>Pagado: {paymentsSum.toFixed(2)} {isPartial && <span className="ml-2 text-sm"> (Anticipo)</span>}</div>
                {change > 0 && <div>Cambio a devolver: {change.toFixed(2)}</div>}
                {isPartial && <div className="text-sm">Venta marcada como parcial (en rojo)</div>}
              </div>
            </div>

            <div className="flex justify-end items-center gap-3">
              <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
                {saving ? "Guardando..." : "Guardar venta"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* modal para crear cliente completo */}
      {showClientForm && <ClientForm client={null} onClose={() => setShowClientForm(false)} onSaved={handleClientCreated} />}
    </div>
  );
}
