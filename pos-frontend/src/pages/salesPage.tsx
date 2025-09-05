import { useState } from "react";
import SalesTable from "../components/salesTable";
import SaleFormModal from "../components/SaleModal";

export default function SalesPage({ sales, onReload, openCashboxId, token }: any) {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = async () => {
    setShowModal(false);
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

      <SalesTable sales={sales} />

      {showModal && (
        <SaleFormModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          cashBoxId={openCashboxId}
          token={token}
        />
      )}
    </div>
  );
}
