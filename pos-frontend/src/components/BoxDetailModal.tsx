import { useEffect, useState } from "react";
import { cashboxService } from "../services/cashboxService";

export default function BoxDetailsModal({ boxId, onClose}: { boxId: number; onClose: ()=>void; token?: string }) {
  const [box, setBox] = useState<any | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profitData, setProfitData] = useState<any>(null);

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [boxId]);

  async function load() {
    setLoading(true);
    try {
      const r = await cashboxService.getById(boxId);
      const data = r.data;
      setBox(data.box ?? data);
      setSales(data.sales ?? []);
      setExpenses(data.expenses ?? []);
      setProfitData(data.profitData ?? null);
    } catch (err) {
      console.error("BoxDetailsModal.load", err);
      setBox(null);
      setSales([]);
      setExpenses([]);
      setProfitData(null);
    } finally {
      setLoading(false);
    }
  }

  // Función para formatear números con separadores
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-BO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded p-4 w-[900px] max-h-[85vh] overflow-auto shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Detalle Caja #{box?.id ?? boxId}</h3>
          <button onClick={onClose} className="text-sm px-2 py-1 bg-gray-200 rounded">Cerrar</button>
        </div>

        {loading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <>
            {/* Información básica de la caja */}
            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Apertura</div>
                <div className="font-medium">{box ? new Date(box.openedAt).toLocaleString() : "-"}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Inicial</div>
                <div className="font-medium">${box ? formatNumber(box.initialAmount ?? 0) : "0.00"}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Estado</div>
                <div className={`font-medium ${box?.status === 'OPEN' ? 'text-green-600' : 'text-blue-600'}`}>
                  {box?.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm text-gray-600">Cierre</div>
                <div className="font-medium">{box?.closedAt ? new Date(box.closedAt).toLocaleString() : "-"}</div>
              </div>
            </div>

            {/* NUEVO: Sección de ganancias netas */}
            {profitData && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  📊 Análisis de Ganancias
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-gray-600">Ventas Totales</div>
                    <div className="text-xl font-bold text-gray-800">
                      ${formatNumber(profitData.totalSales)}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-gray-600">Costo Total</div>
                    <div className="text-xl font-bold text-red-600">
                      -${formatNumber(profitData.totalCost)}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-gray-600">Margen Bruto</div>
                    <div className={`text-xl font-bold ${
                      profitData.totalGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${formatNumber(profitData.totalGrossProfit)} 
                      <span className="text-sm ml-2">
                        ({profitData.marginPercentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <div className="text-sm text-gray-600">Total Gastos</div>
                    <div className="text-xl font-bold text-orange-600">
                      -${formatNumber(profitData.totalExpenses)}
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded border col-span-2 md:col-span-1">
                    <div className="text-sm text-gray-600">Ganancia Neta</div>
                    <div className={`text-2xl font-bold ${
                      profitData.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${formatNumber(profitData.totalNetProfit)}
                    </div>
                    {profitData.profitPerSale > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ ${formatNumber(profitData.profitPerSale)} por venta
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumen visual */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center justify-between text-sm">
                    <span>Ingresos por ventas</span>
                    <span className="font-medium">${formatNumber(profitData.totalSales)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-red-600">
                    <span>Costo de productos vendidos</span>
                    <span>-${formatNumber(profitData.totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium mt-1">
                    <span>Ganancia bruta</span>
                    <span className={profitData.totalGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${formatNumber(profitData.totalGrossProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-orange-600 mt-2">
                    <span>Gastos del día</span>
                    <span>-${formatNumber(profitData.totalExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold mt-2 pt-2 border-t">
                    <span>Ganancia neta final</span>
                    <span className={profitData.totalNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${formatNumber(profitData.totalNetProfit)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Ventas ({sales.length})</h4>
                  <span className="text-sm text-gray-600">
                    Total: ${profitData ? formatNumber(profitData.totalSales) : '0.00'}
                  </span>
                </div>
                <div className="border rounded p-2 max-h-[350px] overflow-auto">
                  {sales.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">No hay ventas.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-gray-600">
                        <tr>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Items</th>
                          <th className="p-2">Cliente</th>
                          <th className="p-2 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.map((s:any) => (
                          <tr key={s.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">{new Date(s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="p-2">{s.items?.length || 0}</td>
                            <td className="p-2">
                              {s.client?.nombre 
                                ? `${s.client.nombre.substring(0, 15)}${s.client.nombre.length > 15 ? '...' : ''}`
                                : 'Sin cliente'}
                            </td>
                            <td className="p-2 text-right font-medium">
                              ${formatNumber(s.total || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Gastos ({expenses.length})</h4>
                  <span className="text-sm text-gray-600">
                    Total: ${profitData ? formatNumber(profitData.totalExpenses) : '0.00'}
                  </span>
                </div>
                <div className="border rounded p-2 max-h-[350px] overflow-auto">
                  {expenses.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">No hay gastos.</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs text-gray-600">
                        <tr>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Concepto</th>
                          <th className="p-2">Usuario</th>
                          <th className="p-2 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e:any) => (
                          <tr key={e.id} className="border-t hover:bg-gray-50">
                            <td className="p-2">{new Date(e.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="p-2" title={e.concept}>
                              {e.concept.length > 20 ? `${e.concept.substring(0, 20)}...` : e.concept}
                            </td>
                            <td className="p-2">
                              {e.user?.name ? e.user.name.split(' ')[0] : 'Sistema'}
                            </td>
                            <td className="p-2 text-right text-red-600 font-medium">
                              -${formatNumber(e.amount || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            {/* NUEVO: Detalle de productos vendidos */}
            {sales.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Detalle de Productos Vendidos</h4>
                <div className="border rounded p-2 max-h-[300px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs text-gray-600">
                      <tr>
                        <th className="p-2">Producto</th>
                        <th className="p-2 text-center">Cant.</th>
                        <th className="p-2 text-right">Costo U.</th>
                        <th className="p-2 text-right">Venta U.</th>
                        <th className="p-2 text-right">Ganancia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.flatMap((sale: any) => 
                        sale.items?.map((item: any, index: number) => {
                          const cost = item.product?.costPrice || 0;
                          const salePrice = item.unitPrice || 0;
                          const profitPerUnit = salePrice - cost;
                          const totalProfit = profitPerUnit * item.quantity;
                          
                          return (
                            <tr key={`${sale.id}-${index}`} className="border-t hover:bg-gray-50">
                              <td className="p-2">
                                <div className="font-medium">{item.product?.name || 'Producto'}</div>
                                <div className="text-xs text-gray-500">{item.product?.sku || 'N/A'}</div>
                              </td>
                              <td className="p-2 text-center">{item.quantity}</td>
                              <td className="p-2 text-right text-red-500">
                                ${formatNumber(cost)}
                              </td>
                              <td className="p-2 text-right text-green-500">
                                ${formatNumber(salePrice)}
                              </td>
                              <td className="p-2 text-right font-medium">
                                <span className={totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  ${formatNumber(totalProfit)}
                                  <span className="text-xs ml-1">
                                    (${formatNumber(profitPerUnit)} c/u)
                                  </span>
                                </span>
                              </td>
                            </tr>
                          );
                        }) || []
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}