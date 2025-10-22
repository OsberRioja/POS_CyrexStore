// src/components/ProductTable.tsx
import { productService } from "../services/productService";
import FormattedPrice from "./FormattedPrice";

export default function ProductTable({
  products,
  loading,
  onEdit,
  onDelete,
}: {    
  products: any[];
  loading: boolean;
  onEdit: (p: any) => void;
  onDelete: () => void;
}) {
  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar producto?")) return;
    try {
      await productService.remove(id);
      onDelete();
    } catch (err) {
      console.error(err);
      alert("Error al eliminar producto");
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (!products.length) return <div className="text-gray-500">No hay productos.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 border text-left">SKU</th>
            <th className="p-3 border text-left">Nombre</th>
            <th className="p-3 border text-left">Descripción</th>
            <th className="p-3 border text-left">Precio Venta</th>
            <th className="p-3 border text-left">Precio Costo</th>
            <th className="p-3 border text-left">Stock</th>
            <th className="p-3 border text-left">Creado por</th>
            <th className="p-3 border text-left">Proveedor</th>
            <th className="p-3 border text-left">Fecha</th>
            <th className="p-3 border text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="p-3 border">{p.sku}</td>
              <td className="p-3 border">{p.name}</td>
              <td className="p-3 border">{p.description}</td>
              <td className="px-6 py-4 text-right">
                <FormattedPrice
                  amount={p.salePrice}
                  fromCurrency="BOB"
                  className="font-semibold"
                  showOriginal={true}
                />
              </td>
              <td className="px-6 py-4 text-right">
                <FormattedPrice
                  amount={p.costPrice}
                  fromCurrency="BOB"
                  className="font-semibold"
                  showOriginal={true}
                />
              </td>
              <td className="p-3 border">{p.stock}</td>
              <td className="p-3 border">{p.user?.name ?? p.user?.email ?? "-"}</td>
              <td className="p-3 border">{p.provider?.name ?? "-"}</td>
              <td className="p-3 border">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</td>
              <td className="p-3 border flex gap-2">
                <button onClick={() => onEdit(p)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Editar</button>
                <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
