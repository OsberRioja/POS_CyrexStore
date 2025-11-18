import React, { useState, useEffect } from 'react';
import { saleService } from '../services/saleService';
import { returnService } from '../services/returnService';

interface ReturnModalProps {
  saleId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReturnModal({ saleId, onClose, onSuccess }: ReturnModalProps) {
  const [sale, setSale] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadSale();
  }, [saleId]);

  const loadSale = async () => {
    try {
      const saleData = await saleService.getById(saleId);
      setSale(saleData);
      
      // Inicializar cantidades máximas
      const initialSelected: { [key: string]: number } = {};
      saleData.items.forEach((item: any) => {
        initialSelected[item.productId] = 0;
      });
      setSelectedItems(initialSelected);
    } catch (error) {
      console.error('Error loading sale:', error);
      alert('Error cargando datos de la venta');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const item = sale.items.find((i: any) => i.productId === productId);
    if (quantity < 0) quantity = 0;
    if (quantity > item.quantity) quantity = item.quantity;
    
    setSelectedItems(prev => ({
      ...prev,
      [productId]: quantity
    }));
  };

  const calculateTotalRefund = () => {
    return sale.items.reduce((total: number, item: any) => {
      const quantity = selectedItems[item.productId] || 0;
      return total + (quantity * item.unitPrice);
    }, 0);
  };

  const hasSelectedItems = () => {
    return Object.values(selectedItems).some(quantity => quantity > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasSelectedItems()) {
      alert('Selecciona al menos un producto para devolver');
      return;
    }

    if (!reason.trim()) {
      alert('El motivo es requerido');
      return;
    }

    const items = sale.items
      .filter((item: any) => selectedItems[item.productId] > 0)
      .map((item: any) => ({
        productId: item.productId,
        quantityReturned: selectedItems[item.productId],
        unitPrice: item.unitPrice,
        condition: 'NEW' // Por defecto
      }));

    const payload = {
      saleId,
      reason,
      items,
      refundMethod,
      notes: notes || undefined
    };

    setSaving(true);
    try {
      await returnService.create(payload);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating return:', error);
      const errorMessage = error.response?.data?.error || 'Error creando devolución';
      alert(errorMessage);

       // Si es error de caja cerrada, podemos cerrar el modal automáticamente
      if (error.response?.status === 400 && errorMessage.includes('caja')) {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Devolución - Venta #{saleId.slice(0, 8)}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Información de la venta */}
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold mb-2">Información de la Venta</h3>
              <p>Cliente: {sale.client?.nombre || 'N/A'}</p>
              <p>Fecha: {new Date(sale.createdAt).toLocaleDateString()}</p>
              <p>Vendedor: {sale.seller?.name || 'N/A'}</p>
            </div>

            {/* Items de la venta */}
            <div>
              <h3 className="font-semibold mb-2">Productos</h3>
              <div className="space-y-2">
                {sale.items.map((item: any) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-gray-600">
                        Vendido: {item.quantity} × Bs. {item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.productId, (selectedItems[item.productId] || 0) - 1)}
                        className="w-8 h-8 bg-gray-200 rounded"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{selectedItems[item.productId] || 0}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.productId, (selectedItems[item.productId] || 0) + 1)}
                        className="w-8 h-8 bg-gray-200 rounded"
                      >
                        +
                      </button>
                      <span className="ml-4 text-sm">
                        Bs. {((selectedItems[item.productId] || 0) * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total a reembolsar */}
            <div className="bg-blue-50 p-4 rounded">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total a reembolsar:</span>
                <span className="text-xl font-bold text-blue-600">
                  Bs. {calculateTotalRefund().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Motivo y método */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Motivo *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border p-2 rounded"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Método de reembolso</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="CREDIT_NOTE">Nota de Crédito</option>
                  <option value="EXCHANGE">Cambio por otro producto</option>
                </select>
              </div>
            </div>

            {/* Notas adicionales */}
            <div>
              <label className="block text-sm font-medium mb-1">Notas adicionales</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border p-2 rounded"
                rows={2}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !hasSelectedItems()}
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
              >
                {saving ? 'Procesando...' : 'Crear Devolución'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}