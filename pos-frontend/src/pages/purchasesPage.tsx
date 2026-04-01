import { useEffect, useMemo, useState } from 'react';
import { Download, FileText, Package, Search, X } from 'lucide-react';
import { stockService } from '../services/stockService';
import { useSettings } from '../context/settingsContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const getCurrencySymbol = (currency?: string) => {
  if (currency === 'USD') return '$';
  if (currency === 'CNY') return '¥';
  return 'Bs.';
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<any | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { receiptSettings } = useSettings();

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const response = await stockService.listPurchases({ limit: 200 });
      setPurchases(response.data?.data || []);
    } catch (error) {
      console.error('Error loading purchases:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const filteredPurchases = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return purchases;

    return purchases.filter((purchase) =>
      purchase.product?.name?.toLowerCase().includes(q) ||
      purchase.product?.sku?.toLowerCase().includes(q) ||
      purchase.provider?.name?.toLowerCase().includes(q) ||
      purchase.user?.name?.toLowerCase().includes(q)
    );
  }, [purchases, searchTerm]);

  const generatePurchasePdf = async (purchase: any) => {
    setIsGeneratingPdf(true);
    try {
      const symbol = getCurrencySymbol(purchase.product?.priceCurrency);
      const total = Math.abs(Number(purchase.quantity || 0)) * Number(purchase.unitCost || 0);

      const wrapper = document.createElement('div');
      wrapper.style.width = '210mm';
      wrapper.style.minHeight = '297mm';
      wrapper.style.padding = '20mm';
      wrapper.style.background = 'white';
      wrapper.style.fontFamily = 'Arial, sans-serif';

      wrapper.innerHTML = `
        <div style="border:1px solid #111;padding:16px;">
          <div style="text-align:center;border-bottom:1px solid #ddd;padding-bottom:10px;margin-bottom:14px;">
            <h1 style="margin:0;font-size:22px;">${receiptSettings.companyName}</h1>
            <p style="margin:4px 0 0 0;font-size:12px;">${receiptSettings.address || ''}</p>
            <p style="margin:2px 0 0 0;font-size:12px;">${receiptSettings.phone || ''}</p>
            <h2 style="margin:12px 0 0 0;font-size:18px;">COMPROBANTE DE COMPRA</h2>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;font-size:12px;">
            <div>
              <strong>ID Movimiento:</strong> ${purchase.id}<br/>
              <strong>Fecha:</strong> ${new Date(purchase.createdAt).toLocaleString('es-BO')}<br/>
              <strong>Usuario:</strong> ${purchase.user?.name || 'N/A'}
            </div>
            <div>
              <strong>Proveedor:</strong> ${purchase.provider?.name || 'Sin proveedor'}<br/>
              <strong>Producto:</strong> ${purchase.product?.name || 'N/A'}<br/>
              <strong>SKU:</strong> ${purchase.product?.sku || 'N/A'}
            </div>
          </div>

          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr>
                <th style="text-align:left;border-bottom:1px solid #ddd;padding:8px;">Cantidad</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:8px;">Costo Unit.</th>
                <th style="text-align:right;border-bottom:1px solid #ddd;padding:8px;">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">${Math.abs(Number(purchase.quantity || 0))}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${symbol} ${Number(purchase.unitCost || 0).toFixed(2)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">${symbol} ${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top:14px;font-size:12px;">
            <strong>Series registradas:</strong>
            <div style="margin-top:6px;word-break:break-all;">${(purchase.serialNumbers || []).join(', ') || 'Sin series'}</div>
          </div>

          ${purchase.notes ? `<div style="margin-top:14px;font-size:12px;"><strong>Notas:</strong> ${purchase.notes}</div>` : ''}
        </div>
      `;

      document.body.appendChild(wrapper);
      const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, logging: false });
      document.body.removeChild(wrapper);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`compra-${purchase.id}.pdf`);
    } catch (error) {
      console.error('Error generating purchase PDF:', error);
      alert('No se pudo generar el PDF de la compra.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600 mt-1">Historial de compras registradas con detalle y series.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center gap-3">
          <Search size={20} className="text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por producto, SKU, proveedor o usuario..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando compras...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPurchases.map((purchase) => {
                const symbol = getCurrencySymbol(purchase.product?.priceCurrency);
                return (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{new Date(purchase.createdAt).toLocaleString('es-BO')}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{purchase.product?.name}</div>
                      <div className="text-xs text-gray-500">SKU: {purchase.product?.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{purchase.provider?.name || 'Sin proveedor'}</td>
                    <td className="px-6 py-4 text-center font-semibold">{Math.abs(Number(purchase.quantity || 0))}</td>
                    <td className="px-6 py-4 text-right font-semibold">{symbol} {Number(purchase.unitCost || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{purchase.user?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedPurchase(purchase)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Ver detalle"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => generatePurchasePdf(purchase)}
                          disabled={isGeneratingPdf}
                          className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                          title="Descargar PDF"
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && filteredPurchases.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <p>No hay compras registradas con los filtros actuales.</p>
          </div>
        )}
      </div>

      {selectedPurchase && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Detalle de compra #{selectedPurchase.id}</h2>
              <button onClick={() => setSelectedPurchase(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-semibold">Fecha:</span> {new Date(selectedPurchase.createdAt).toLocaleString('es-BO')}</p>
                  <p><span className="font-semibold">Producto:</span> {selectedPurchase.product?.name}</p>
                  <p><span className="font-semibold">SKU:</span> {selectedPurchase.product?.sku}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Proveedor:</span> {selectedPurchase.provider?.name || 'Sin proveedor'}</p>
                  <p><span className="font-semibold">Usuario:</span> {selectedPurchase.user?.name || 'N/A'}</p>
                  <p><span className="font-semibold">Cantidad:</span> {Math.abs(Number(selectedPurchase.quantity || 0))}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Series registradas</p>
                <div className="bg-gray-50 border rounded p-3 text-sm break-all">
                  {(selectedPurchase.serialNumbers || []).join(', ') || 'Sin series'}
                </div>
              </div>

              {selectedPurchase.notes && (
                <div>
                  <p className="font-semibold mb-2">Notas</p>
                  <div className="bg-gray-50 border rounded p-3 text-sm">{selectedPurchase.notes}</div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => generatePurchasePdf(selectedPurchase)}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
