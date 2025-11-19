import { useState } from "react";
import ExpensesTable from "../components/expensesTable";
import ExpenseFormModal from "../components/ExpenseModal";
import { reportService } from "../services/reportService";
import { Download } from "lucide-react";

interface ExpensesPageProps {
  expenses: any[];
  onReload: () => void;
  openCashboxId?: number;
  token?: string;
  isClosedCashbox?: boolean;
  cashboxId?: number;
}

export default function ExpensesPage({
  expenses,
  onReload,
  openCashboxId,
  token,
  isClosedCashbox = false,
  cashboxId
}: ExpensesPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleSuccess = async () => {
    setShowModal(false);
    await onReload();
  };

  const handleDownloadExpensesReport = async () => {
    if (!cashboxId) {
      alert("No se puede generar el reporte: ID de caja no disponible");
      return;
    }

    setDownloadingReport(true);
    try {
      await reportService.downloadExpensesReport(cashboxId);
      // Éxito silencioso - el archivo se descarga automáticamente
    } catch (error: any) {
      console.error("Error descargando reporte de gastos:", error);
      alert(error.message || "Error al descargar el reporte de gastos");
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Gastos</h3>
        <div className="flex gap-2">
          {/* Botón de descarga de reporte - solo para cajas cerradas */}
          {isClosedCashbox && cashboxId && (
            <button
              onClick={handleDownloadExpensesReport}
              disabled={downloadingReport}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={16} />
              {downloadingReport ? "Generando Excel..." : "Descargar Reporte"}
            </button>
          )}
          
          {/* Botón de nuevo gasto - solo para caja abierta */}
          {openCashboxId && (
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Información adicional para cajas cerradas */}
      {isClosedCashbox && cashboxId && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                📊 Modo de visualización - Caja Cerrada
              </p>
              <p className="text-xs text-blue-600">
                Puedes descargar el reporte completo de gastos en Excel
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-800">
                {expenses.length} gastos registrados
              </p>
              <p className="text-xs text-blue-600">
                Total: Bs. {expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <ExpensesTable expenses={expenses} />

      {showModal && (
        <ExpenseFormModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          cashBoxId={openCashboxId!}
          token={token}
        />
      )}
    </div>
  );
}