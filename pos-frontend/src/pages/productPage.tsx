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
  const [currentPage, setCurrentPage] = useState(1);

  const PRODUCTS_PER_PAGE = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [showInactive, currentBranchId, products.length]);

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
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

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
        products={paginatedProducts}
        loading={loading}
        onEdit={openEdit} 
        onDelete={loadProducts} 
        onDeactivate={handleDeactivate} 
        onActivate={handleActivate}
        canEdit={hasPermission(Permission.PRODUCT_UPDATE)}
        canDelete={hasPermission(Permission.PRODUCT_DELETE)}
        canToggleActive={hasPermission(Permission.PRODUCT_TOGGLE_ACTIVE)}
      />

      {!loading && filteredProducts.length > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-sm text-slate-600">
            Mostrando {(currentPage - 1) * PRODUCTS_PER_PAGE + 1}-
            {Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} de {filteredProducts.length} productos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-10 min-w-[110px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm font-medium text-slate-600">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              className="h-10 min-w-[110px] rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

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
