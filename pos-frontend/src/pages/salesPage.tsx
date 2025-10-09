import { useState } from "react";
import SalesTable from "../components/salesTable";
import SaleFormModal from "../components/SaleModal";
import SaleDetailsModal from "../components/SaleDetailModal";
import AddPaymentModal from "../components/AddPaymentModal";

interface SalesPageProps {
  sales: any[];
  onReload: () => void;
  openCashboxId?: number;
  //onAddPayment?: (sale: any) => void;
  token?: string;
}

export default function SalesPage({ sales, onReload, openCashboxId, token }: SalesPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Ventas</h3>
        {openCashboxId && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            + Nuevo
          </button>
        )}
      </div>

      <SalesTable
       sales={sales || []}
       onViewSale={handleViewSale}
       onAddPayment={handleAddPayment}
      />

      {showModal &&   openCashboxId &&(
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
          currentCashBoxId={openCashboxId} // ← Pasar la caja actual (puede ser undefined)
        />
      )}
    </div>
  );
}
