import { useEffect, useState } from "react";
import ProductTable from "../components/ProductTable";
import ProductForm from "../components/ProductForm";
import { productService } from "../services/productService";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
//import type { PermissionType } from "../types/permissions";
import { PermissionGuard } from "../components/PermissionGuard";


export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { hasPermission } = usePermissions();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll();
      setProducts(res.data ?? []);
    } catch (err) {
      console.error("Error cargando productos", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const openNew = () => { setSelected(null); setShowForm(true); };
  const openEdit = (p: any) => { 
    if (!p.isActive) {
      if (!confirm("Este producto está desactivado. ¿Deseas editarlo?")) return;
    }
    setSelected(p); 
    setShowForm(true); 
  };

  const handleDeactivate = async (productId: string) => {
    if (!confirm("¿Desactivar este producto? No estará disponible para ventas.")) return;
    try {
      await productService.deactivate(productId);
      loadProducts();
      alert('Producto desactivado');
    } catch (err) {
      console.error(err);
      alert("Error al desactivar producto");
    }
  };

  const handleActivate = async (productId: string) => {
    try {
      await productService.activate(productId);
      loadProducts();
      alert('Producto activado');
    } catch (err) {
      console.error(err);
      alert("Error al activar producto");
    }
  };

  const filteredProducts = showInactive ? products : products.filter(p => p.isActive);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Productos</h2>
        <div className="flex items-center gap-4">
          <PermissionGuard permission={Permission.PRODUCT_READ}>
            {/* Toggle para mostrar/ocultar inactivos */}
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Mostrar productos desactivados
            </label>
          </PermissionGuard>
          <PermissionGuard permission={Permission.PRODUCT_CREATE}>
            <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded">+ NUEVO</button>
          </PermissionGuard>
        </div>
      </div>

      <ProductTable 
        products={filteredProducts}
        loading={loading}
        onEdit={openEdit} 
        onDelete={loadProducts} 
        onDeactivate={handleDeactivate} 
        onActivate={handleActivate}
        canEdit={hasPermission(Permission.PRODUCT_UPDATE)}
        canDelete={hasPermission(Permission.PRODUCT_DELETE)}
        canToggleActive={hasPermission(Permission.PRODUCT_TOGGLE_ACTIVE)}
      />

      {showForm && (
        <ProductForm
          product={selected}
          onClose={() => { setShowForm(false); setSelected(null); loadProducts(); }}
          onSaved={() => loadProducts()}
        />
      )}
    </div>
  );
}
