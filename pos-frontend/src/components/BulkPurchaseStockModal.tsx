import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, Wand2, X } from 'lucide-react';
import axios from 'axios';
import { stockService } from '../services/stockService';

interface BulkPurchaseStockModalProps {
  products: any[];
  initialProduct?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface PurchaseLine {
  localId: string;
  productId: string;
  product: any;
  quantity: number;
  unitCost: number;
  providerId?: number;
  notes: string;
  firstSerial: string;
  lastSerial: string;
  serialNumbers: string[];
}

const createLineFromProduct = (product: any): PurchaseLine => ({
  localId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  productId: product.id,
  product,
  quantity: 1,
  unitCost: Number(product.costPrice || 0),
  providerId: product.providerId || undefined,
  notes: '',
  firstSerial: '',
  lastSerial: '',
  serialNumbers: [''],
});

const extractSerialPattern = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*?)(\d+)$/);

  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
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
    throw new Error('El prefijo y la longitud del primer y último número de serie deben coincidir.');
  }

  if (end.value < start.value) {
    throw new Error('El último número de serie no puede ser menor al primero.');
  }

  return Array.from({ length: end.value - start.value + 1 }, (_, index) => {
    const current = start.value + index;
    return `${start.prefix}${String(current).padStart(start.width, '0')}`;
  });
};

const BulkPurchaseStockModal: React.FC<BulkPurchaseStockModalProps> = ({
  products,
  initialProduct,
  onClose,
  onSuccess,
}) => {
  const [providers, setProviders] = useState<any[]>([]);
  const [lines, setLines] = useState<PurchaseLine[]>(initialProduct ? [createLineFromProduct(initialProduct)] : []);
  const [productQuery, setProductQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    loadProviders();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase();
    const selectedIds = new Set(lines.map((line) => line.productId));

    return products.filter((product) => {
      if (selectedIds.has(product.id)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    });
  }, [lines, productQuery, products]);

  const updateLine = (localId: string, updater: (line: PurchaseLine) => PurchaseLine) => {
    setLines((current) => current.map((line) => (line.localId === localId ? updater(line) : line)));
  };

  const updateSerialAt = (localId: string, serialIndex: number, value: string) => {
    updateLine(localId, (line) => ({
      ...line,
      serialNumbers: line.serialNumbers.map((serial, index) => (index === serialIndex ? value : serial)),
    }));
  };

  const syncQuantity = (line: PurchaseLine, quantity: number): PurchaseLine => {
    const nextQuantity = Math.max(1, quantity);
    let serialNumbers = [...line.serialNumbers];

    if (serialNumbers.length > nextQuantity) {
      serialNumbers = serialNumbers.slice(0, nextQuantity);
    } else if (serialNumbers.length < nextQuantity) {
      serialNumbers = [...serialNumbers, ...Array.from({ length: nextQuantity - serialNumbers.length }, () => '')];
    }

    return {
      ...line,
      quantity: nextQuantity,
      serialNumbers,
    };
  };

  const handleGenerateSerials = (localId: string) => {
    setError(null);

    updateLine(localId, (line) => {
      const generated = buildSequentialSerials(line.firstSerial, line.lastSerial);
      return {
        ...line,
        quantity: generated.length,
        serialNumbers: generated,
      };
    });
  };

  const addProductLine = (product: any) => {
    setLines((current) => [...current, createLineFromProduct(product)]);
    setProductQuery('');
  };

  const totalCost = lines.reduce((sum, line) => sum + line.quantity * line.unitCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError('Debes agregar al menos un producto a la compra.');
      return;
    }

    const duplicatedProducts = new Set<string>();
    const duplicatedSerials = new Set<string>();
    const allSerials = new Set<string>();

    for (const line of lines) {
      if (!line.productId) {
        setError('Todas las filas deben tener un producto seleccionado.');
        return;
      }

      if (duplicatedProducts.has(line.productId)) {
        setError(`El producto ${line.product.name} está repetido en la compra.`);
        return;
      }
      duplicatedProducts.add(line.productId);

      if (!line.providerId) {
        setError(`Debes seleccionar un proveedor para ${line.product.name}.`);
        return;
      }

      if (line.quantity <= 0) {
        setError(`La cantidad para ${line.product.name} debe ser mayor a cero.`);
        return;
      }

      if (line.unitCost < 0) {
        setError(`El costo unitario para ${line.product.name} no puede ser negativo.`);
        return;
      }

      const cleanedSerials = line.serialNumbers.map((serial) => serial.trim()).filter(Boolean);
      if (cleanedSerials.length !== line.quantity) {
        setError(`Debes completar una serie por cada unidad de ${line.product.name}.`);
        return;
      }

      if (new Set(cleanedSerials).size !== cleanedSerials.length) {
        setError(`Las series de ${line.product.name} no pueden repetirse.`);
        return;
      }

      for (const serial of cleanedSerials) {
        if (allSerials.has(serial)) {
          duplicatedSerials.add(serial);
        }
        allSerials.add(serial);
      }
    }

    if (duplicatedSerials.size > 0) {
      setError(`Hay números de serie repetidos entre productos: ${Array.from(duplicatedSerials).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await stockService.registerPurchaseBatch({
        purchases: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          unitCost: line.unitCost,
          providerId: line.providerId,
          notes: line.notes.trim() || undefined,
          serialNumbers: line.serialNumbers.map((serial) => serial.trim()),
        })),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error registering batch purchase:', err);
      setError(err.response?.data?.error || 'Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registrar compra de stock</h2>
            <p className="text-sm text-gray-600">
              Compra varios productos en un solo registro. El costo se toma del producto como referencia y se actualiza con el nuevo lote.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <Search size={18} className="text-blue-600" />
              <h3 className="font-semibold text-blue-900">Agregar productos a la compra</h3>
            </div>
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o categoría"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-3 max-h-56 overflow-y-auto bg-white border rounded-md divide-y">
              {filteredProducts.slice(0, 20).map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addProductLine(product)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50"
                >
                  <div className="font-medium text-gray-900">{product.name}</div>
                  <div className="text-xs text-gray-500">
                    SKU: {product.sku} • Stock actual: {product.stock} • Costo actual: Bs. {Number(product.costPrice || 0).toFixed(2)}
                  </div>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No hay productos disponibles para agregar.
                </div>
              )}
            </div>
          </div>

          {lines.length > 0 && (
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div key={line.localId} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{index + 1}. {line.product.name}</h3>
                      <p className="text-xs text-gray-500">SKU: {line.product.sku}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLines((current) => current.filter((item) => item.localId !== line.localId))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.localId, (current) => syncQuantity(current, Number(e.target.value)))}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Costo unitario (Bs)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitCost}
                            onChange={(e) => updateLine(line.localId, (current) => ({ ...current, unitCost: Number(e.target.value) }))}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Se actualizará el costo base del producto al guardar esta compra.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                          <select
                            value={line.providerId || ''}
                            onChange={(e) => updateLine(line.localId, (current) => ({ ...current, providerId: e.target.value ? Number(e.target.value) : undefined }))}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecciona proveedor</option>
                            {providers.map((provider) => (
                              <option key={provider.id_provider} value={provider.id_provider}>
                                {provider.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notas del lote</label>
                        <textarea
                          value={line.notes}
                          onChange={(e) => updateLine(line.localId, (current) => ({ ...current, notes: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Factura, lote, observaciones..."
                        />
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700">Costo total del item</p>
                        <p className="text-2xl font-bold text-green-800">
                          Bs. {(line.quantity * line.unitCost).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-800">Autogenerar series</h4>
                            <p className="text-xs text-gray-500">Puedes generar por rango y luego editar cada valor.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              try {
                                handleGenerateSerials(line.localId);
                              } catch (err: any) {
                                setError(err.message || 'No se pudieron generar las series');
                              }
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Wand2 size={16} />
                            Generar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Primera serie</label>
                            <input
                              value={line.firstSerial}
                              onChange={(e) => updateLine(line.localId, (current) => ({ ...current, firstSerial: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ej: TEC-1001"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Última serie</label>
                            <input
                              value={line.lastSerial}
                              onChange={(e) => updateLine(line.localId, (current) => ({ ...current, lastSerial: e.target.value }))}
                              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ej: TEC-1005"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden">
                        <div className="px-4 py-3 bg-gray-100 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-800">Series editables</h4>
                            <p className="text-xs text-gray-500">{line.serialNumbers.filter((serial) => serial.trim()).length}/{line.quantity} completadas</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateLine(line.localId, (current) => syncQuantity(current, current.quantity + 1))}
                            className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-white"
                          >
                            <Plus size={16} />
                            Añadir fila
                          </button>
                        </div>
                        <div className="max-h-72 overflow-y-auto divide-y">
                          {line.serialNumbers.map((serial, serialIndex) => (
                            <div key={`${line.localId}-${serialIndex}`} className="flex items-center gap-3 p-3 bg-white">
                              <div className="w-14 text-sm text-gray-500">#{serialIndex + 1}</div>
                              <input
                                value={serial}
                                onChange={(e) => updateSerialAt(line.localId, serialIndex, e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`Serie ${serialIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="bg-slate-50 border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">Productos en la compra</p>
              <p className="text-2xl font-bold text-slate-900">{lines.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Total de la compra</p>
              <p className="text-2xl font-bold text-slate-900">Bs. {totalCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Registrar compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkPurchaseStockModal;
