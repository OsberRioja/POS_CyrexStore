import { useEffect, useState } from "react";
import ProductTable from "../components/ProductTable";
import ProductForm from "../components/ProductForm";
import { productService } from "../services/productService";
import { usePermissions } from "../hooks/usePermissions";
import { Permission } from "../types/permissions";
import { PermissionGuard } from "../components/PermissionGuard";
import { useAuth } from "../context/authContext"; // ← importar useAuth
import { useBranch } from "../hooks/useBranch"; // ← importar useBranch
import { useDialog } from "../context/DialogContext";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const { hasPermission } = usePermissions();
  const { confirm, alert } = useDialog();
  const { currentBranchId } = useAuth(); // ← obtener currentBranchId
  const { branches, currentBranchId: branchId } = useBranch(); // usar hook de sucursal

  // Obtener nombre de la sucursal actual
  const currentBranchName = branches.find(b => b.id === branchId)?.name;

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({ 
        onlyActive: !showInactive,
        branchId: currentBranchId ?? undefined 
      });
      setProducts(res.data ?? []);
    } catch (err) {
      console.error("Error cargando productos", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadProducts(); 
  }, [currentBranchId, showInactive]); // ← NUEVO: recargar cuando cambie la sucursal

  const openNew = () => { 
    setSelected(null); 
    setShowForm(true); 
  };

  const openEdit = async (p: any) => { 
    if (!p.isActive) {
      const shouldContinue = await confirm({
        title: 'Producto desactivado',
        message: 'Este producto está desactivado. ¿Deseas editarlo?',
        confirmText: 'Sí, editar',
      });
      if (!shouldContinue) return;
    }
    setSelected(p); 
    setShowForm(true); 
  };

  const handleDeactivate = async (productId: string) => {
    const shouldDeactivate = await confirm({
      title: 'Desactivar producto',
      message: '¿Desactivar este producto? No estará disponible para ventas.',
      confirmText: 'Desactivar',
      danger: true,
    });
    if (!shouldDeactivate) return;
    try {
      await productService.deactivate(productId);
      loadProducts();
      alert('Producto desactivado', 'success');
    } catch (err) {
      console.error(err);
      alert("Error al desactivar producto", 'error');
    }
  };

  const handleActivate = async (productId: string) => {
    try {
      await productService.activate(productId);
      loadProducts();
      alert('Producto activado', 'success');
    } catch (err) {
      console.error(err);
      alert("Error al activar producto", 'error');
    }
  };

  const filteredProducts = showInactive ? products : products.filter(p => p.isActive);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-700">Productos</h2>
          {/* ← NUEVO: Mostrar sucursal actual */}
          {currentBranchName && (
            <p className="text-sm text-gray-500">
              Sucursal: {currentBranchName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <PermissionGuard permission={Permission.PRODUCT_READ}>
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
