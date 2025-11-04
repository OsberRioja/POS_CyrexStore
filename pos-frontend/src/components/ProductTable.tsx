// src/components/ProductTable.tsx
import { productService } from "../services/productService";
//import FormattedPrice from "./FormattedPrice";
import ProductPrice from "../services/ProductPrice";
import { Eye, EyeOff } from 'lucide-react';

export default function ProductTable({
  products,
  loading,
  onEdit,
  onDelete,
  onDeactivate,
  onActivate,
}: {    
  products: any[];
  loading: boolean;
  onEdit: (p: any) => void;
  onDelete: () => void;
  onDeactivate: (productId: string) => void;
  onActivate: (productId: string) => void;
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
            <th className="p-3 border text-left">Precios</th>
            
            <th className="p-3 border text-left">Stock</th>
            <th className="p-3 border text-left">Creado por</th>
            <th className="p-3 border text-left">Proveedor</th>
            <th className="p-3 border text-left">Fecha</th>
            <th className="p-3 border text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={`hover:bg-gray-50 ${!p.isActive ? 'bg-gray-100 opacity-70' : ''}`}>
              <td className="p-3 border">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  p.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                  }`}>
                  {p.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="p-3 border">{p.sku}</td>
              <td className="p-3 border">
                <div>
                  <div className="font-medium text-gray-900">{p.name}</div>
                  {/* Badge de moneda */}
                  {p.priceCurrency && p.priceCurrency !== 'BOB' && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      {p.priceCurrency === 'USD' ? '🇺🇸 Precio en Dólares' : '🇨🇳 Precio en Yuanes'}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-3 border">{p.description}</td>
              {/* ← NUEVO: Columna unificada de precios usando ProductPrice */}
              <td className="p-3 border">
                <ProductPrice 
                  product={{
                    salePrice: p.salePrice,
                    costPrice: p.costPrice,
                    priceCurrency: p.priceCurrency || 'BOB' // Valor por defecto
                  }}
                  showCost={true}
                  showOriginal={true}
                  className="text-sm"
                />
              </td>
              <td className="p-3 border text-center">
                <span className={`font-semibold ${p.stock < 10 ? 'text-red-600' : 'text-gray-900'}`}>
                  {p.stock}
                </span>
              </td>
              <td className="p-3 border">{p.user?.name ?? p.user?.email ?? "-"}</td>
              <td className="p-3 border">{p.provider?.name ?? "-"}</td>
              <td className="p-3 border">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</td>
              <td className="p-3 border flex gap-2">
                <button onClick={() => onEdit(p)} className="px-2 py-1 bg-yellow-500 text-white rounded text-sm">Editar</button>
                <button 
                  onClick={() => p.isActive ? onDeactivate(p.id) : onActivate(p.id)}
                  className={`px-2 py-1 rounded text-sm flex items-center gap-1 ${
                    p.isActive 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-green-500 text-white'
                  }`}
                  title={p.isActive ? 'Desactivar producto' : 'Activar producto'}
                  >
                  {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                  {p.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button onClick={() => handleDelete(p.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
