import React, { useEffect, useState } from "react";
import { productService, type ProductPayload } from "../services/productService";
import { supplierService, type Supplier } from "../services/supplierService";
import { useAuth } from "../context/authContext";
import { DollarSign, CheckSquare, Square } from "lucide-react";
//import { useCurrency } from "../context/currencyContext";

type FormState = {
  sku: string;
  name: string;
  description?: string;
  costPrice: string; // string en el form mientras el usuario escribe
  salePrice: string;
  priceCurrency: string;
  stock: string;
  category?: string;
  brand?: string;
  providerId?: string | null; // string o null en el form
};

export default function ProductForm({ product, onClose, onSaved } : { product?: any | null; onClose: () => void; onSaved?: () => void }) {
  const { token: _token } = useAuth();
  //const { currency: userCurrency } = useCurrency();
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", phone: "" });

  const [form, setForm] = useState<FormState>({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    costPrice: product?.costPrice != null ? String(product.costPrice) : "",
    salePrice: product?.salePrice != null ? String(product.salePrice) : "",
    priceCurrency: product?.priceCurrency ?? "BOB",
    stock: product?.stock != null ? String(product.stock) : "",
    category: product?.category ?? "",
    brand: product?.brand ?? "",
    providerId: product?.providerId ?? (product?.provider?.id_provider ?? product?.provider?.id) ?? null,
  });

  const isEditing = !!(product && (product.id || product._id));

  useEffect(() => { loadSuppliers(); }, []);

  useEffect(() => {
    // cuando cambia el producto (editar), reasignar form
    setForm({
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      costPrice: product?.costPrice != null ? String(product.costPrice) : "",
      salePrice: product?.salePrice != null ? String(product.salePrice) : "",
      priceCurrency: product?.priceCurrency ?? "BOB",
      stock: product?.stock != null ? String(product.stock) : "",
      category: product?.category ?? "",
      brand: product?.brand ?? "",
      providerId: product?.providerId ?? (product?.provider?.id_provider ?? product?.provider?.id) ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const loadSuppliers = async () => {
    try {
      const res = await supplierService.getAll();
      setSuppliers(res.data ?? []);
    } catch (err) {
      console.error("Error cargando proveedores", err);
      setSuppliers([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // parsear números aquí (y validar)
      const cost = form.costPrice.trim() === "" ? NaN : Number(form.costPrice.replace(",", "."));
      const sale = form.salePrice.trim() === "" ? NaN : Number(form.salePrice.replace(",", "."));
      const stockNum = form.stock.trim() === "" ? NaN : Number(form.stock);

      if (!form.sku.trim() || !form.name.trim()) {
        throw new Error("SKU y nombre son requeridos");
      }
      if (!isEditing &&(Number.isNaN(cost) || Number.isNaN(sale) || Number.isNaN(stockNum))) {
        throw new Error("Precio de costo, precio de venta y stock deben ser números válidos");
      }

      const payload: ProductPayload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        costPrice: cost,
        salePrice: sale,
        priceCurrency: form.priceCurrency,
        stock: Math.floor(stockNum),
        category: form.category?.trim() || undefined,
        brand: form.brand?.trim() || undefined,
        providerId: form.providerId ? Number(form.providerId) : null,
      };

      if (isEditing) {
        await productService.update(product.id ?? product._id, payload);
      } else {
        await productService.create(payload);
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error("Error guardando producto", err);
      alert(err?.response?.data?.error ?? err?.message ?? "Error al guardar producto");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await supplierService.create(newSupplier);
      const created: Supplier = res.data;
      // añadir y seleccionar
      setSuppliers((s) => [...s, created]);
      setForm((f) => ({ ...f, providerId: (created.id_provider ?? created.id) as any }));
      setShowSupplierModal(false);
      setNewSupplier({ name: "", phone: "" });
    } catch (err: any) {
      console.error("Error creando proveedor", err);
      alert(err?.response?.data?.error ?? "Error al crear proveedor");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[720px] rounded shadow p-6">
        <h3 className="text-xl font-semibold mb-4">{product ? "Editar producto" : "Nuevo producto"}</h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">

          <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU" className="border p-2 rounded col-span-2" required />
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" className="border p-2 rounded col-span-2" required />
          <textarea name="description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value })} placeholder="Descripción" className="border p-2 rounded col-span-2" />
          <input name="category" value={form.category} onChange={handleChange} placeholder="Categoría" className="border p-2 rounded" />
          <input name="brand" value={form.brand} onChange={handleChange} placeholder="Marca" className="border p-2 rounded" />
          {/* ✅ NUEVO: Selector de Moneda de Precio */}
          {!isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-blue-600" />
                  <span className="font-semibold text-gray-800">Moneda del Precio</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {['BOB', 'USD', 'CNY'].map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setForm({ ...form, priceCurrency: curr })}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      form.priceCurrency === curr
                        ? 'border-blue-600 bg-blue-100 text-blue-800 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {form.priceCurrency === curr ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                    <span>{curr === 'BOB' ? '🇧🇴 Bs.' : curr === 'USD' ? '🇺🇸 $' : '🇨🇳 ¥'}</span>
                  </button>
                ))}
              </div>

              <p className="text-xs text-blue-700 mt-2">
                {form.priceCurrency === 'USD' && (
                  <>
                    💡 <strong>Precio anclado a dólar:</strong> El precio se ajustará automáticamente según el tipo de cambio.
                  </>
                )}
                {form.priceCurrency === 'BOB' && (
                  <>
                    Los precios son fijos en bolivianos.
                  </>
                )}
                {form.priceCurrency === 'CNY' && (
                  <>
                    💡 <strong>Precio anclado a yuan:</strong> El precio se ajustará automáticamente según el tipo de cambio.
                  </>
                )}
              </p>
            </div>
          )}
          {/* Precios y Stock - solo en creación */}
          {!isEditing && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Costo ({form.priceCurrency === 'BOB' ? 'Bs.' : form.priceCurrency === 'USD' ? '$' : '¥'})
                </label>
                <input 
                  name="costPrice" 
                  type="text" 
                  inputMode="decimal" 
                  pattern="[0-9]*([.,][0-9]+)?" 
                  value={form.costPrice} 
                  onChange={handleChange} 
                  placeholder="0.00" 
                  className="w-full border p-2 rounded" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio Venta ({form.priceCurrency === 'BOB' ? 'Bs.' : form.priceCurrency === 'USD' ? '$' : '¥'})
                </label>
                <input 
                  name="salePrice" 
                  type="text" 
                  inputMode="decimal" 
                  pattern="[0-9]*([.,][0-9]+)?" 
                  value={form.salePrice} 
                  onChange={handleChange} 
                  placeholder="0.00" 
                  className="w-full border p-2 rounded" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Inicial
                </label>
                <input 
                  name="stock" 
                  type="text" 
                  inputMode="decimal" 
                  pattern="[0-9]*" 
                  value={form.stock} 
                  onChange={handleChange} 
                  placeholder="0" 
                  className="w-full border p-2 rounded" 
                  required
                />
              </div>
            </div>
          )}
          {/* proveedor select + boton nuevo */}
          <div className="col-span-2 flex items-center gap-2">
            <select
              name="providerId"
              value={form.providerId ?? ""}
              onChange={handleChange}
              className="border p-2 rounded flex-1"
            >
              <option value="">Seleccionar proveedor</option>
              {suppliers.map((s) => (
                <option key={s.id_provider ?? s.id} value={s.id_provider ?? s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ""}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => setShowSupplierModal(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Nuevo</button>
          </div>

          <div className="col-span-2 flex justify-end gap-2 mt-3">
            <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>

      {/* modal nuevo proveedor */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
          <div className="bg-white rounded p-4 w-96">
            <h4 className="font-semibold mb-2">Nuevo proveedor</h4>
            <form onSubmit={handleCreateSupplier} className="space-y-2">
              <input value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} placeholder="Nombre" className="w-full border p-2 rounded" required />
              <input value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} placeholder="Teléfono" className="w-full border p-2 rounded" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSupplierModal(false)} className="px-3 py-1 border rounded">Cancelar</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
