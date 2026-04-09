// src/pages/PaymentMethodsPage.tsx
import { useEffect, useState } from "react";
import PaymentMethodTable from "../components/paymentMethodTable";
import PaymentMethodForm from "../components/paymentMethodForm";
import { paymentMethodService } from "../services/paymentMethodService";
import { reportService } from "../services/reportService";
//import { useAuth } from "../context/authContext";
import { Download } from "lucide-react";
import { useDialog } from "../context/DialogContext";

interface PaymentMethodsPageProps {
  cashBoxId?: number | null;
  onBack?: () => void;
  isClosedCashbox?: boolean;
}

export default function PaymentMethodsPage({
  cashBoxId,
  onBack,
  isClosedCashbox = false
}: PaymentMethodsPageProps) {
  // const { token } = useAuth();
  // const _token = token ?? undefined;

  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const { alert, confirm } = useDialog();

  const load = async () => {
    setLoading(true);
    try {
      // traer métodos
      const r = await paymentMethodService.list();
      const list = r.data ?? [];

      // si tenemos cashBoxId pedimos resumen y combinamos totales
      if (cashBoxId) {
        const s = await paymentMethodService.summaryByBox(cashBoxId);
        const sums = s.data ?? [];
        const map = new Map<number, number>();
        sums.forEach((x: any) => map.set(x.id, Number(x.total ?? 0)));

        const merged = list.map((m: any) => ({ ...m, total: map.get(m.id) ?? 0 }));
        setMethods(merged);
      } else {
        setMethods(list.map((m: any) => ({ ...m, total: 0 })));
      }
    } catch (err) {
      console.error("Error loading payment methods", err);
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [cashBoxId]);

  const handleCreate = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (m: any) => { setEditing(m); setShowForm(true); };

  const handleSave = async (payload: { name: string; isCash: boolean }) => {
    if (editing) {
      await paymentMethodService.update(editing.id, payload);
    } else {
      await paymentMethodService.create(payload);
    }
    await load();
  };

  const handleDelete = async (id: number) => {
    const shouldDelete = await confirm({
      title: 'Eliminar método',
      message: '¿Eliminar método de pago?',
      confirmText: 'Eliminar',
      danger: true,
    });
    if (!shouldDelete) return;
    try {
      await paymentMethodService.remove(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar", 'error');
    }
  };

   const handleDownloadPaymentMethodsReport = async () => {
    if (!cashBoxId) {
      alert("No se puede generar el reporte: ID de caja no disponible", 'warning');
      return;
    }

    setDownloadingReport(true);
    try {
      await reportService.downloadPaymentMethodsReport(cashBoxId);
      // Éxito silencioso - el archivo se descarga automáticamente
    } catch (error: any) {
      console.error("Error descargando reporte de métodos de pago:", error);
      alert(error.message || "Error al descargar el reporte de métodos de pago", 'error');
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Métodos de pago</h2>
        <div className="flex gap-2">
          {/* Botón de descarga de reporte - solo para cajas cerradas */}
          {isClosedCashbox && cashBoxId && (
            <button
              onClick={handleDownloadPaymentMethodsReport}
              disabled={downloadingReport}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={16} />
              {downloadingReport ? "Generando Excel..." : "Descargar Reporte"}
            </button>
          )}
          
          {/* Botón de nuevo método de pago - no mostramos en caja cerrada */}
          {!isClosedCashbox && (
            <button onClick={handleCreate} className="px-3 py-1 bg-blue-500 text-white rounded">+ Nuevo</button>
          )}
          
          {onBack && <button onClick={onBack} className="px-3 py-1 bg-gray-300 rounded">Volver</button>}
        </div>
      </div>

      {/* Información adicional para cajas cerradas */}
      {isClosedCashbox && cashBoxId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                📊 Modo de visualización - Caja Cerrada
              </p>
              <p className="text-xs text-blue-600">
                Puedes descargar el reporte completo de métodos de pago en Excel
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-800">
                {methods.length} métodos de pago
              </p>
              <p className="text-xs text-blue-600">
                Total Recaudado: Bs. {methods.reduce((sum: number, method: any) => sum + method.total, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? <p>Cargando...</p> : <PaymentMethodTable methods={methods} onEdit={handleEdit} onDelete={handleDelete} />}

      {showForm && (
        <PaymentMethodForm
          method={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => load()}
          saveFn={(payload) => handleSave(payload)}
        />
      )}
    </div>
  );
}
