// src/pages/ProductsPage.tsx
import { useEffect, useState } from "react";
import ProductTable from "../components/ProductTable";
import ProductForm from "../components/ProductForm";
import { productService } from "../services/productService";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

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
  const openEdit = (p: any) => { setSelected(p); setShowForm(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Productos</h2>
        <div>
          <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded">+ NUEVO</button>
        </div>
      </div>

      <ProductTable products={products} loading={loading} onEdit={openEdit} onDelete={loadProducts} />

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
