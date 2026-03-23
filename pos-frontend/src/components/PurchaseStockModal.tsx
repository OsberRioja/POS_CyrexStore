import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Wand2, X } from 'lucide-react';
import { stockService } from '../services/stockService';
import axios from 'axios';

interface PurchaseStockModalProps {
  product: any;
  onClose: () => void;
  onSuccess: () => void;
}

const extractSerialPattern = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*?)(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    numericPart: match[2],
    value: Number(match[2]),
    width: match[2].length,
  };
};

const buildSequentialSerials = (startSerial: string, endSerial: string) => {
  const start = extractSerialPattern(startSerial);
  const end = extractSerialPattern(endSerial);

  if (!start || !end) {
    throw new Error('Los números de serie deben terminar en una parte numérica consecutiva.');
  }

  if (start.prefix !== end.prefix || start.width !== end.width) {
    throw new Error('El prefijo y la longitud numérica del primer y último número de serie deben coincidir.');
  }

  if (end.value < start.value) {
    throw new Error('El último número de serie no puede ser menor al primero.');
  }

  const serials: string[] = [];
  for (let current = start.value; current <= end.value; current += 1) {
    serials.push(`${start.prefix}${String(current).padStart(start.width, '0')}`);
  }

  return serials;
};

const PurchaseStockModal: React.FC<PurchaseStockModalProps> = ({ product, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(product?.costPrice || 0);
  const [providerId, setProviderId] = useState<number | undefined>(product?.providerId || undefined);
  const [notes, setNotes] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstSerial, setFirstSerial] = useState('');
  const [lastSerial, setLastSerial] = useState('');
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    setSerialNumbers((current) => {
      if (current.length === quantity) {
        return current;
      }

      if (quantity <= current.length) {
        return current.slice(0, quantity);
      }

      return [...current, ...Array.from({ length: quantity - current.length }, () => '')];
    });
  }, [quantity]);

  const loadProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/providers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProviders(response.data || []);
    } catch (err) {
      console.error('Error loading providers:', err);
    }
  };

  const updateSerialAt = (index: number, value: string) => {
    setSerialNumbers((current) => current.map((serial, idx) => (idx === index ? value : serial)));
  };

  const handleGenerateSerials = () => {
    setError(null);

    try {
      const generated = buildSequentialSerials(firstSerial, lastSerial);
      setQuantity(generated.length);
      setSerialNumbers(generated);
    } catch (err: any) {
      setError(err.message || 'No se pudieron generar los números de serie');
    }
  };

  const serialsPreview = useMemo(() => {
    const cleaned = serialNumbers.map((serial) => serial.trim()).filter(Boolean);
    return cleaned;
  }, [serialNumbers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedSerialNumbers = serialNumbers.map((serial) => serial.trim()).filter(Boolean);

    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (unitCost < 0) {
      setError('El costo unitario no puede ser negativo');
      return;
    }

    if (!providerId) {
      setError('Debes seleccionar un proveedor previamente creado');
      return;
    }

    if (cleanedSerialNumbers.length !== quantity) {
      setError('Debes registrar un número de serie por cada unidad comprada');
      return;
    }

    if (new Set(cleanedSerialNumbers).size !== cleanedSerialNumbers.length) {
      setError('Los números de serie no pueden estar duplicados');
      return;
    }

    setLoading(true);

    try {
      await stockService.registerPurchase({
        productId: product.id,
        quantity,
        unitCost,
        providerId,
        notes: notes.trim() || undefined,
        serialNumbers: cleanedSerialNumbers,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error registering purchase:', err);
      setError(err.response?.data?.error || 'Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = quantity * unitCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold">Registrar Compra de Stock</h2>
            <p className="text-sm text-gray-600">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Stock Actual</p>
                <p className="text-2xl font-bold text-blue-600">{product.stock} unidades</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Comprar *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nuevo stock: {product.stock + quantity} unidades
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Costo Unitario (Bs) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Costo Total</p>
                <p className="text-2xl font-bold text-green-600">
                  Bs. {totalCost.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor *
                </label>
                <select
                  value={providerId || ''}
                  onChange={(e) => setProviderId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecciona un proveedor</option>
                  {providers.map((provider) => (
                    <option key={provider.id_provider} value={provider.id_provider}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ej: Factura #12345, lote de importación de marzo..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">Números de Serie</h3>
                    <p className="text-xs text-gray-500">
                      Ingresa el primero y el último para autocompletar, luego puedes editar cualquier valor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSerials}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Wand2 size={16} />
                    Generar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primer número de serie</label>
                    <input
                      value={firstSerial}
                      onChange={(e) => setFirstSerial(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 1001 o TEC-1001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Último número de serie</label>
                    <input
                      value={lastSerial}
                      onChange={(e) => setLastSerial(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: 1005 o TEC-1005"
                    />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">Detalle editable</h4>
                    <p className="text-xs text-gray-500">Se guardarán {quantity} unidades con su serie individual.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSerialNumbers((current) => [...current, '']);
                      setQuantity((current) => current + 1);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-white"
                  >
                    <Plus size={16} />
                    Añadir fila
                  </button>
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y">
                  {serialNumbers.map((serial, index) => (
                    <div key={`${index}-${serial}`} className="flex items-center gap-2 p-3 bg-white">
                      <div className="w-16 text-sm text-gray-500 font-medium">#{index + 1}</div>
                      <input
                        value={serial}
                        onChange={(e) => updateSerialAt(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Número de serie ${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (serialNumbers.length === 1) {
                            setSerialNumbers(['']);
                            setQuantity(1);
                            return;
                          }
                          const updated = serialNumbers.filter((_, idx) => idx !== index);
                          setSerialNumbers(updated);
                          setQuantity(updated.length);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Eliminar fila"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <p className="font-medium">Resumen de series válidas: {serialsPreview.length}/{quantity}</p>
                {serialsPreview.length > 0 && (
                  <p className="mt-1 break-all">
                    {serialsPreview.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar Compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseStockModal;
