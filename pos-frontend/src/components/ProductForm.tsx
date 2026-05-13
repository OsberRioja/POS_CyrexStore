import React, { useEffect, useState } from "react";
import { productService, type ProductPayload } from "../services/productService";
import { supplierService, type Supplier } from "../services/supplierService";
import { useAuth } from "../context/authContext";
import { DollarSign, CheckSquare, Square, Upload, X } from "lucide-react";
import { imageUploadService } from "../services/imageUploadService";

type FormState = {
  sku: string;
  codigoInterno: string;
  name: string;
  description?: string;
  costPrice: string; // string en el form mientras el usuario escribe
  salePrice: string;
  priceCurrency: string;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<ProductPayload | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [autoGenerateCode, setAutoGenerateCode] = useState(!product);

  const [form, setForm] = useState<FormState>({
    sku: product?.sku ?? "",
    codigoInterno: product?.codigoInterno ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    costPrice: product?.costPrice != null ? String(product.costPrice) : "",
    salePrice: product?.salePrice != null ? String(product.salePrice) : "",
    priceCurrency: product?.priceCurrency ?? "BOB",
    category: product?.category ?? "",
    brand: product?.brand ?? "",
    providerId: product?.providerId ?? (product?.provider?.id_provider ?? product?.provider?.id) ?? null,
  });

  const isEditing = !!(product && (product.id || product._id));

  useEffect(() => {
    loadSuppliers();
    loadMetadata();
    if (product?.imageUrl) {
      setImagePreview(product.imageUrl);
    }
  }, []);

  useEffect(() => {
    // cuando cambia el producto (editar), reasignar form
    setForm({
      sku: product?.sku ?? "",
      codigoInterno: product?.codigoInterno ?? "",
      name: product?.name ?? "",
      description: product?.description ?? "",
      costPrice: product?.costPrice != null ? String(product.costPrice) : "",
      salePrice: product?.salePrice != null ? String(product.salePrice) : "",
      priceCurrency: product?.priceCurrency ?? "BOB",
      category: product?.category ?? "",
      brand: product?.brand ?? "",
      providerId: product?.providerId ?? (product?.provider?.id_provider ?? product?.provider?.id) ?? null,
    });

    // Actualizar preview de imagen cuando cambia el producto
    if (product?.imageUrl) {
      setImagePreview(product.imageUrl);
    }else {
      setImagePreview(null);
    }
    setImageFile(null);
  }, [product]);
  useEffect(() => {
    if (!isEditing && autoGenerateCode) {
      generateNextCodigoInterno();
    }
  }, [autoGenerateCode]);

  const loadSuppliers = async () => {
    try {
      const res = await supplierService.getAll();
      setSuppliers(res.data ?? []);
    } catch (err) {
      console.error("Error cargando proveedores", err);
      setSuppliers([]);
    }
  };

  const normalizeTextField = (value?: string) => value?.trim().replace(/\s+/g, " ") || "";

  const loadMetadata = async () => {
    try {
      const res = await productService.getMetadata();
      setCategoryOptions(res.data?.categories ?? []);
      setBrandOptions(res.data?.brands ?? []);
    } catch (err) {
      console.error("Error cargando metadata de productos", err);
      setCategoryOptions([]);
      setBrandOptions([]);
    }
  };
  const generateNextCodigoInterno = async () => {
    try {
      const res = await productService.getNextCodigoInterno();

      setForm((prev) => ({
        ...prev,
        codigoInterno: res.data.codigoInterno
      }));
    } catch (err) {
      console.error("Error generando código interno", err);
      alert("No se pudo generar el código interno");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      
      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const saveProduct = async (payload: ProductPayload) => {
    if (isEditing) {
      await productService.update(product.id ?? product._id, payload);
    } else {
      await productService.create(payload);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // parsear números aquí (y validar)
      const cost = form.costPrice.trim() === "" ? NaN : Number(form.costPrice.replace(",", "."));
      const sale = form.salePrice.trim() === "" ? NaN : Number(form.salePrice.replace(",", "."));

      if (!form.name.trim()) {
        throw new Error("Nombre es requerido");
      }
      if (!/^\d{7}$/.test(form.codigoInterno.trim())) {
        throw new Error("Código interno debe tener exactamente 7 dígitos numéricos");
      }
      if (!isEditing &&(Number.isNaN(cost) || Number.isNaN(sale))) {
        throw new Error("Precio de costo y precio de venta deben ser números válidos");
      }

      // Subir imagen si hay una nueva
      let imageUrl = product?.imageUrl || undefined;
      if (imageFile) {
        setUploadingImage(true);
        const uploadResult = await imageUploadService.uploadImage(imageFile);

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Error al subir la imagen");
        }

        imageUrl = uploadResult.url;
        setUploadingImage(false);
      } else if (imagePreview === null && product?.imageUrl) {
        // Si se removió la imagen existente
        imageUrl = undefined;
      }

      const payload: ProductPayload = {
        sku: form.sku.trim() || undefined,
        codigoInterno: form.codigoInterno.trim(),
        name: form.name.trim(),
        description: form.description?.trim() || undefined,
        costPrice: cost,
        salePrice: sale,
        priceCurrency: form.priceCurrency,
        stock: 0,
        category: normalizeTextField(form.category) || undefined,
        brand: normalizeTextField(form.brand) || undefined,
        providerId: form.providerId ? Number(form.providerId) : null,
        imageUrl: imageUrl,
      };
      if (isEditing) {
        setPendingPayload(payload);
        setShowScopeModal(true);
        return;
      }

      await saveProduct(payload);

      onSaved?.();
      onClose();
    } catch (err: any) {
      console.error("Error guardando producto", err);
      alert(err?.response?.data?.error ?? err?.message ?? "Error al guardar producto");
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleScopeSelection = async (applyToAllBranches: boolean) => {
    if (!pendingPayload) return;
    setSaving(true);
    try {
      await saveProduct({ ...pendingPayload, applyToAllBranches });
      setShowScopeModal(false);
      setPendingPayload(null);
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
    <>
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[720px] rounded shadow p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">{product ? "Editar producto" : "Nuevo producto"}</h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          {/* Imagen del producto */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del producto
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="product-image"
                />
                <label htmlFor="product-image"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <Upload size={20} />
                  <span className="text-sm">{imagePreview ? "Cambiar imagen" : "Seleccionar imagen"}</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">WEBP, JPG, PNG. Máx 5MB.</p>
              </div>
              {imagePreview && (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border"/>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU (opcional)" className="border p-2 rounded col-span-2" />
          <div className="col-span-2 space-y-2">
            <input
              name="codigoInterno"
              value={form.codigoInterno}
              onChange={handleChange}
              placeholder="Código interno (7 dígitos)"
              className={`border p-2 rounded w-full ${
                autoGenerateCode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
              required
              pattern="\d{7}"
              maxLength={7}
              disabled={autoGenerateCode}
            />
          
            {!isEditing && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoGenerateCode}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                  
                    setAutoGenerateCode(checked);
                  
                    if (checked) {
                      await generateNextCodigoInterno();
                    } else {
                      setForm((prev) => ({
                        ...prev,
                        codigoInterno: ""
                      }));
                    }
                  }}
                />
          
                Generar código automáticamente
              </label>
            )}
          </div>
          <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" className="border p-2 rounded col-span-2" required />
          <textarea name="description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value })} placeholder="Descripción" className="border p-2 rounded col-span-2" />
          <input name="category" list="category-options" value={form.category} onChange={handleChange} placeholder="Categoría" className="border p-2 rounded" />
          <datalist id="category-options">{categoryOptions.map((category) => <option key={category} value={category} />)}</datalist>
          <input name="brand" list="brand-options" value={form.brand} onChange={handleChange} placeholder="Marca" className="border p-2 rounded" />
          <datalist id="brand-options">{brandOptions.map((brand) => <option key={brand} value={brand} />)}</datalist>
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
            <div className="grid grid-cols-2 gap-3">
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
            <button type="submit" disabled={saving || uploadingImage} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">{saving || uploadingImage ? "Guardando..." : "Guardar"}</button>
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
    {showScopeModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
        <div className="bg-white w-full max-w-lg rounded-lg shadow-xl p-6">
          <h4 className="text-lg font-semibold mb-2">Aplicar cambio de precios</h4>
          <p className="text-sm text-gray-600 mb-4">
            ¿Desea aplicar este cambio solo en esta sucursal o en todas las sucursales?
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => handleScopeSelection(false)}
              disabled={saving}
            >
              Solo esta sucursal
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => handleScopeSelection(true)}
              disabled={saving}
            >
              Todas las sucursales
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={() => {
                setShowScopeModal(false);
                setPendingPayload(null);
              }}
              disabled={saving}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
