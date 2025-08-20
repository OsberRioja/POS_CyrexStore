import React from "react";
import { fetchProducts } from "./api";

export default function ProductList() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await fetchProducts();
        setProducts(p);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Cargando productos...</div>;
  if (!products.length) return <div>No hay productos todavía.</div>;

  return (
    <div>
      <h2>Productos</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>SKU</th><th>Nombre</th><th>Proveedor</th><th>Compra</th><th>Venta</th><th>Creado</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td>{p.sku}</td>
              <td>{p.name}</td>
              <td>{p.provider?.name ?? "-"}</td>
              <td>{p.purchasePrice}</td>
              <td>{p.salePrice}</td>
              <td>{new Date(p.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
