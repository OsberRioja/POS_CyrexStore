import { useState } from "react";
import SalesTable from "../components/salesTable";
import SaleFormModal from "../components/SaleModal";
import SaleDetailsModal from "../components/SaleDetailModal";
import AddPaymentModal from "../components/AddPaymentModal";
import { reportService } from "../services/reportService";
import { Download } from "lucide-react";
import { usePdfGenerator } from "../hooks/usePdfGenerator";
//import { useAuth } from "../context/authContext";
import { useBranch } from "../hooks/useBranch";

interface SalesPageProps {
  sales: any[];
  onReload: () => void;
  openCashboxId?: number;
  token?: string;
  isClosedCashbox?: boolean;
  cashboxId?: number;
  onEditSale?: (sale: any) => void;
  isReopened?: boolean;
}

export default function SalesPage({ sales, onReload, openCashboxId, token, isClosedCashbox, cashboxId, onEditSale, isReopened }: SalesPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { downloadReceipt, isGenerating } = usePdfGenerator();

  //const { currentBranchId } = useAuth();
  const { branches, currentBranchId: branchId } = useBranch();

  // Obtener nombre de la sucursal actual
  const currentBranchName = branches.find(b => b.id === branchId)?.name;

  const handleSuccess = async () => {
    setShowModal(false);
    await onReload();
  };

  const handleViewSale = (sale: any) => {
    setSelectedSale(sale);
    setShowDetailsModal(true);
  };

  const handleAddPayment = (sale: any) => {
    setSelectedSale(sale);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSelectedSale(null);
    await onReload();
  };

  const handleDownloadReceipt = async (sale: any) => {
    try {
      await downloadReceipt(sale);
    } catch (error: any) {
      console.error('Error descargando comprobante:', error);
      alert(error.message || 'No se pudo descargar el comprobante');
    }
  };

  const filteredSales = (sales || []).filter((sale) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    return (
      String(sale.saleNumber || '').includes(q) ||
      String(sale.id || '').toLowerCase().includes(q) ||
      String(sale.client?.nombre || '').toLowerCase().includes(q)
    );
  });

  // Descargar reporte de ventas
  const handleDownloadSalesReport = async () => {
    if (!cashboxId) {
      alert('ID de caja no disponible para reporte');
      return;
    }

    setDownloadingReport(true);
    try {
      await reportService.downloadSalesReport(cashboxId);
    } catch (error: any) {
      console.error('Error descargando reporte:', error);
      alert(error.message || 'Error descargando reporte');
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold">Ventas</h3>
          {/*← Mostrar sucursal actual */}
          {currentBranchName && (
            <p className="text-xs text-gray-500">
              Sucursal: {currentBranchName}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {/* Botón de descarga de reporte - solo para cajas cerradas */}
          {isClosedCashbox && cashboxId && (
            <button
              onClick={handleDownloadSalesReport}
              disabled={downloadingReport}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={16} />
              {downloadingReport ? "Generando Excel..." : "Descargar Reporte"}
            </button>
          )}
          
          {/* Botón de nueva venta - solo para caja abierta */}
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

      <div className="mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por N° de venta, ID o cliente..."
          className="w-full md:w-96 border border-gray-300 rounded px-3 py-2 text-sm"
        />
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
                Puedes descargar el reporte completo de ventas en Excel
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-blue-800">
                {sales.length} ventas registradas
              </p>
              <p className="text-xs text-blue-600">
                Total: Bs. {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      <SalesTable
        sales={filteredSales}
        onViewSale={handleViewSale}
        onAddPayment={handleAddPayment}
        onEditSale={onEditSale}
        onReload={onReload}
        isReopened={isReopened}
        onDownloadReceipt={handleDownloadReceipt}
      />

      {isGenerating && (
        <p className="text-xs text-blue-600 mt-2">Generando comprobante...</p>
      )}

      {showModal && openCashboxId && (
        <SaleFormModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          cashBoxId={openCashboxId} 
          token={token}
        />
      )}

      {showDetailsModal && selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedSale(null);
          }}
        />
      )}

      {showPaymentModal && selectedSale && (
        <AddPaymentModal
          sale={selectedSale}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedSale(null);
          }}
          onSuccess={handlePaymentSuccess}
          token={token}
          currentCashBoxId={openCashboxId}
        />
      )}
    </div>
  );
}
