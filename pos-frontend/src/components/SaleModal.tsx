import React, { useEffect, useState } from "react";
import { productService } from "../services/productService";
import { clientService } from "../services/clientService";
import { userService } from "../services/userService";
import { paymentMethodService } from "../services/paymentMethodService";
import { saleService } from "../services/saleService";
import ClientForm from "./ClientForm"; // usamos el formulario completo de cliente
import { exchangeRateService } from "../services/exchangeRateService";
import { useAuth } from "../context/authContext";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";

type Item = { productId: string; name: string; qty: number; unitPrice: number; subtotal: number; originalPrice?: number; originalCurrency?: string; conversionRate?: number };
type Payment = { paymentMethodId: number; amount: number };

export default function SaleFormModal({
  cashBoxId,
  //token,
  onClose,
  onSuccess,
}: {
  cashBoxId?: number;
  token?: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  
  const { user: currentUser } = useAuth();
  const { hasPermission } = usePermissions();

  // productos
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

  // NUEVO: Estado para pagos parciales
  const [allowPartialPayment, setAllowPartialPayment] = useState(false);
  const [paymentWarning, setPaymentWarning] = useState("");

  // UI
  const [saving, setSaving] = useState(false);

  const [showSellerResults, setShowSellerResults] = useState(false);
  const [showClientResults, setShowClientResults] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'SELLER') {
      setSellerSelected(currentUser);
    }
  }, [currentUser]);

  //const { currency } = useCurrency();

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
        const r = await productService.search({ q: queryProduct, onlyActive: true });
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
        setShowClientResults(false);
        return;
      }

      // Solo evitar busqueda si el query actual coincide con el cliente seleccionado
      //Permitir busqueda incluso si hay cliente seleccionado
      const selectedClientName = clientSelected?.nombre ?? clientSelected?.name ?? "";
      if (clientSelected && q===selectedClientName) {
        setClientsResults([]);
        setShowClientResults(false);
        return;
      }
      try {
        const r = await clientService.search({ q });
        // backend devuelve { data, total } o array
        const data = Array.isArray(r.data) ? r.data : r.data?.data ?? r.data ?? [];
        setClientsResults(data);
        setShowClientResults(true);
      } catch (err) {
        console.error(err);
        setClientsResults([]);
        setShowClientResults(false);
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
        setShowSellerResults(false);
        return;
      }

      //Permitir busqueda incluso si hay vendedor seleccionado
      const selectedSellerName = sellerSelected?.name || sellerSelected?.username || '';
      if (sellerSelected && q === selectedSellerName) {
        setSellerResults([]);
        setShowSellerResults(false);
        return;
      }

      try {
        // userService.getUsers acepta q opcional (ya lo tienes implementado)
        const r = await userService.getUsers();
        const data = Array.isArray(r.data) ? r.data : r.data?.data ?? r.data ?? [];
        setSellerResults(data);
        setShowSellerResults(true);
      } catch (err) {
        console.error("buscar vendedores:", err);
        setSellerResults([]);
        setShowSellerResults(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [sellerQuery]);

  // NUEVA: Función para calcular totales
  const calculateTotals = () => {
    const itemsTotal = items.reduce((sum, item) => {
      return sum + item.subtotal;
    }, 0);
    
    const paymentsTotal = payments.reduce((sum, payment) => {
      return sum + Number(payment.amount || 0);
    }, 0);
    
    return { itemsTotal, paymentsTotal };
  };

  // NUEVA: Validación actualizada
  const validateSale = () => {
    const { itemsTotal, paymentsTotal } = calculateTotals();
    
    if (paymentsTotal < 0) {
      setPaymentWarning('Los pagos no pueden ser negativos');
      return false;
    }
    
    if (paymentsTotal > itemsTotal) {
      setPaymentWarning(`Se debe dar cambio de  (${(paymentsTotal-itemsTotal).toFixed(2)}`);
      return true;
    }
    
    if (paymentsTotal < itemsTotal && !allowPartialPayment) {
      setPaymentWarning(`El total pagado (${paymentsTotal.toFixed(2)}) es menor al total de la venta (${itemsTotal.toFixed(2)}). Active "Permitir pago parcial" si desea crear un anticipo.`);
      return false;
    }
    
    setPaymentWarning('');
    return true;
  };

  // Efecto para validar en tiempo real
  useEffect(() => {
    if (items.length > 0 && payments.length > 0) {
      validateSale();
    }
  }, [items, payments, allowPartialPayment]);

  //cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Solo cerrar No fue en:
      // - input de busqueda
      // - resultados de busqueda
      // - botones de limpieza
      if (!target.closest('input') &&
          !target.closest('.search-results') &&
          !target.closest('.clear-button')) {
      setShowSellerResults(false);
      setShowClientResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const convertPriceToBOB = async (price: number, fromCurrency: string): Promise<{ convertedPrice: number; rate: number }> => {
    if (fromCurrency === 'BOB') {
      return { convertedPrice: price, rate: 1 };
    }

    try {
      const response = await exchangeRateService.convert(price, fromCurrency, 'BOB');
      return {
        convertedPrice: response.data.converted,
        rate: response.data.rate
      };
    } catch (error) {
      console.error('Error converting price:', error);
      // En caso de error, usar el precio original (aunque esté en otra moneda)
      return { convertedPrice: price, rate: 1 };
    }
  };

  const addProduct = async (p: any) => {
    const productCurrency = p.priceCurrency || 'BOB';
    const originalPrice = p.salePrice ?? p.sale_price ?? 0;
    
    let finalPrice = originalPrice;
    let conversionRate = 1;

    // Si el producto está en otra moneda, convertir a BOB
    if (productCurrency !== 'BOB') {
      try {
        const conversion = await convertPriceToBOB(originalPrice, productCurrency);
        finalPrice = conversion.convertedPrice;
        conversionRate = conversion.rate;
      } catch (error) {
        console.error('Error converting product price:', error);
        // Si falla la conversión, usar precio original pero mostrar advertencia
        alert(`Advertencia: No se pudo convertir el precio de ${p.name}. Se usará el precio en ${productCurrency}.`);
      }
    };


    const it: Item = { 
      productId: p.id, 
      name: p.name, 
      qty: 1, 
      unitPrice: Number(finalPrice), 
      subtotal: Number(finalPrice),
      originalPrice: Number(originalPrice),        // ← Guardar precio original
      originalCurrency: productCurrency,           // ← Guardar moneda original
      conversionRate: conversionRate               // ← Guardar tasa de cambio
    };
    
    setItems((s) => [...s, it]);
    setQueryProduct("");
    setProductResults([]);
  };

  const changeQty = (idx: number, qty: number) => {
    if (qty < 1) qty = 1;
    setItems((s) => s.map((it, i) => (i === idx ? { ...it, qty, subtotal: Math.round(it.unitPrice * qty * 100) / 100 } : it)));
  };

  const removeItem = (idx: number) => setItems((s) => s.filter((_, i) => i !== idx));

  const { itemsTotal, paymentsTotal } = calculateTotals();
  const remaining = Math.max(0, Math.round((itemsTotal - paymentsTotal) * 100) / 100);
  const change = Math.max(0, Math.round((paymentsTotal - itemsTotal) * 100) / 100);
  const isPartial = paymentsTotal < itemsTotal;

  // Función para limpiar selección de cliente
  const clearClientSelection = () => {
    setClientSelected(null);
    setClientQuery("");
    setShowClientResults(false);
  };

  // Función para limpiar selección de vendedor
  const clearSellerSelection = () => {
    setSellerSelected(null);
    setSellerQuery("");
    setShowSellerResults(false);
  };

  const searchClients = async (q: string) => {
    setClientQuery(q);
  };

  const handleClientSelect = (c: any) => {
    setClientSelected(c);
    setClientsResults([]);
    setShowClientResults(false);
    setClientQuery(c.nombre ?? c.name ?? "");
  };

  const handleSellerSelect = (u: any) => {
    setSellerSelected(u);
    setSellerResults([]);
    setShowSellerResults(false);
    setSellerQuery(u.name ?? u.username ?? `${u.name} (${u.userCode ?? ""})`);
  };

  // crear cliente usando ClientForm (usa onSaved)
  const handleClientCreated = (createdClient: any) => {
    setClientSelected(createdClient);
    setClientQuery(createdClient.nombre ?? createdClient.name ?? "");
    setShowClientForm(false);
    setShowClientResults(false);
  };

  const handleCreateClientNow = async () => {
    // abrir formulario completo
    setShowClientForm(true);
  };


  const addPayment = (pmId: number, amount: number) => {
    if (!pmId || Number.isNaN(amount) || amount <= 0) return alert("Monto inválido");
    setPayments((s) => [...s, { paymentMethodId: pmId, amount }]);
  };

  const removePayment = (idx: number) => setPayments((s) => s.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    //validar permisos
    if (!hasPermission(Permission.SALE_CREATE)) {
      alert("No tienes permiso para crear ventas.");
      return;
    }

    if (!clientSelected) {
      return alert("Selecciona o crea un cliente para continuar");
    }
    if (items.length === 0) return alert("Agrega al menos 1 producto");
    if (payments.length === 0) {
      return alert("Agrega al menos 1 pago (puede ser anticipo)");
    }

    if (!validateSale()) {
      return; // La validación ya mostró el error
    }

    const payload: any = {
      sellerUserCode: sellerSelected ? sellerSelected.userCode : undefined,
      sellerId: sellerSelected ? sellerSelected.id : undefined,
      client: { id_cliente: clientSelected.id_cliente },
      items: items.map((it) => ({ productId: it.productId, quantity: it.qty, unitPrice: it.unitPrice, originalPrice: it.originalPrice, originalCurrency: it.originalCurrency, conversionRate: it.conversionRate })),
      payments: payments.map((p) => ({ paymentMethodId: p.paymentMethodId, amount: p.amount })),
      allowPartialPayment: allowPartialPayment, // NUEVO: enviar flag
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
          <div className={`grid gap-3 ${currentUser?.role !== 'SELLER' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* VENDEDOR - ocultar para vendedores */}
            {currentUser?.role !== 'SELLER' && (
              <div>
                <label className="text-sm">Vendedor (nombre o código)</label>
                <div className="flex gap-2">
                  <div className="flex gap-2 items-center flex-1">
                    <input
                      placeholder="Buscar vendedor por nombre o código"
                      value={sellerQuery}
                      onChange={(e) => setSellerQuery(e.target.value)}
                      onFocus={() => clientQuery.trim() && !clientSelected && setShowClientResults(true)}
                      className="border p-2 rounded flex-1"
                    />
                    {sellerSelected && (
                      <button 
                        type="button" 
                        onClick={clearSellerSelection} 
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm clear-button"
                        title="Cambiar Vendedor"
                      >
                        X
                      </button>
                    )}
                  </div>
                  
                </div>

                {/* lista de resultados por nombre - solo mostrar cuando showSellerResults es true*/}
                {showSellerResults && sellerResults.length > 0 && (
                  <div className="border rounded mt-1 max-h-32 overflow-auto bg-white z-50 search-results">
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
            )}

            {/* Para vendedores, mostrar info del vendedor actual */}
            {currentUser?.role === 'SELLER' && (
              <div>
                <label className="text-sm">Vendedor</label>
                <div className="p-2 bg-gray-100 rounded text-sm">
                  {currentUser.name} (Tú)
                </div>
              </div>
            )}

            {/* CLIENTE */}
            <div>
              <label className="text-sm">Cliente</label>
              <div className="flex gap-2 items-center flex-1">
                <input
                  placeholder="Buscar clientes"
                  value={clientQuery}
                  onChange={(e) => searchClients(e.target.value)}
                  onFocus={() => clientQuery.trim() && !clientSelected && setShowClientResults(true)}
                  className="border p-2 rounded flex-1"
                />
                {clientSelected && (
                  <button type="button" onClick={clearClientSelection} className="px-2 py-1 bg-red-500 text-white rounded text-sm clear-button"
                    title="Cambiar Cliente">
                    X
                  </button>
                )}
              </div>
              
              {showClientResults && clientsResults.length > 0 && (
                <div className="border rounded mt-1 max-h-32 overflow-auto bg-white z-50 search-results">
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
                {hasPermission(Permission.CLIENT_CREATE) &&(
                  <button type="button" onClick={handleCreateClientNow} className="px-3 py-1 bg-green-600 text-white rounded">
                    Crear cliente
                  </button>
                )}
                <div className="text-sm mt-1">{clientSelected ? `Cliente: ${clientSelected.nombre}` : ""}</div>
              </div>
            </div>

          </div>

          {/* PRODUCT SEARCH + ITEMS */}
          <div>
            <label className="text-sm">Buscar producto</label>
            <div className="flex gap-2 mt-1">
              <input value={queryProduct} onChange={(e) => setQueryProduct(e.target.value)} placeholder="Nombre o SKU" className="border p-2 rounded flex-1" />
              <div className="w-36 flex-none text-right text-sm text-gray-500 pt-2">total: {itemsTotal.toFixed(2)}</div>
            </div>

            {productResults.length > 0 && (
              <div className="border rounded mt-1 max-h-40 overflow-auto bg-white">
                {productResults.map((p) => {
                  const productCurrency = p.priceCurrency || 'BOB';
                  const needsConversion = productCurrency !== 'BOB';
                  
                  return (
                    <div key={p.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => addProduct(p)}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku} • Stock: {p.stock}</div>
                          {needsConversion && (
                            <div className="text-xs text-blue-600 mt-1">
                              💰 Precio en {productCurrency}: {Number(p.salePrice).toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            Bs. {Number(p.salePrice).toFixed(2)}
                            {needsConversion && (
                              <div className="text-xs text-gray-500">(convertido)</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {items.length > 0 && (
              <div className="mt-2">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Producto</th>
                      <th className="p-2">Cant.</th>
                      <th className="p-2 text-right">Precio Unit.</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{it.name}</div>
                            {/* ← Información de conversión directa */}
                            {it.originalCurrency && it.originalCurrency !== 'BOB' && (
                              <div className="text-xs text-gray-500 mt-1">
                                Original: {it.originalCurrency} {it.originalPrice?.toFixed(2)}
                                {it.conversionRate && it.conversionRate !== 1 && (
                                  <span className="ml-1">
                                    (1 {it.originalCurrency} = {it.conversionRate.toFixed(4)} BOB)
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            value={it.qty} 
                            min={1} 
                            onChange={(e) => changeQty(idx, Number(e.target.value))} 
                            className="w-20 border p-1 rounded" 
                          />
                        </td>
                        <td className="p-2 text-right">
                          <div className="font-semibold">Bs. {it.unitPrice.toFixed(2)}</div>
                        </td>
                        <td className="p-2 text-right">
                          <div className="font-semibold">Bs. {it.subtotal.toFixed(2)}</div>
                        </td>
                        <td className="p-2">
                          <button 
                            type="button" 
                            onClick={() => removeItem(idx)} 
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
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

          {/* Resumen de totales */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal de productos:</span>
                <span className="font-semibold">Bs. {itemsTotal.toFixed(2)}</span>
              </div>

              {/* ← NUEVO: Mostrar si hay productos en otras monedas */}
              {items.some(item => item.originalCurrency && item.originalCurrency !== 'BOB') && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💱 Incluye productos convertidos de otras monedas
                </div>
              )}

              <div className="flex justify-between">
                <span>Total a pagar:</span>
                <span className="font-semibold">Bs. {paymentsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className={isPartial ? 'text-red-600' : 'text-green-600'}>
                  {isPartial ? 'Saldo pendiente:' : change > 0 ? 'Cambio:' : 'Diferencia:'}
                </span>
                <span className={`font-bold ${isPartial ? 'text-red-600' : change > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                  Bs. {isPartial ? remaining.toFixed(2) : change.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          

          {/* NUEVO: Checkbox para permitir pagos parciales */}
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="allowPartialPayment"
              checked={allowPartialPayment}
              onChange={(e) => setAllowPartialPayment(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="allowPartialPayment" className="text-sm text-gray-700">
              Permitir pago parcial (anticipo)
            </label>
          </div>

          {/* NUEVO: Warning de pagos */}
          {paymentWarning && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{paymentWarning}</p>
                </div>
              </div>
            </div>
          )}

          {/* NUEVO: Indicador visual del tipo de venta */}
          {allowPartialPayment && isPartial && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <strong>Venta con anticipo:</strong> Se registrará un saldo pendiente de {remaining.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT METHODS - esquina inferior derecha */}
          <div className="flex justify-end">
            <div className="w-full max-w-md">
              <label className="text-sm font-medium">Métodos de pago</label>
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
                  <div key={i} className="text-sm flex justify-between items-center py-1">
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

          <div className="flex justify-end items-center gap-3">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
              {saving ? "Guardando..." : "Guardar venta"}
            </button>
          </div>
        </form>
      </div>

      {/* modal para crear cliente completo */}
      {showClientForm && <ClientForm client={null} onClose={() => setShowClientForm(false)} onSaved={handleClientCreated} />}
    </div>
  );
}