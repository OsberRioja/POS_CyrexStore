import { useState } from "react";
import ExpensesTable from "../components/expensesTable";
import ExpenseFormModal from "../components/ExpenseModal";

export default function ExpensesPage({ expenses, onReload, openCashboxId, token }: any) {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = async () => {
    setShowModal(false);
    await onReload();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Gastos</h3>
        {openCashboxId && (
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1 bg-yellow-500 text-white rounded"
          >
            + Nuevo
          </button>
        )}
      </div>

      <ExpensesTable expenses={expenses} />

      {showModal && (
        <ExpenseFormModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSuccess}
          cashBoxId={openCashboxId}
          token={token}
        />
      )}
    </div>
  );
}
