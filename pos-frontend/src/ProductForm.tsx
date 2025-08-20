import React from "react";
import { createProduct } from "./api";

export default function ProductForm({ onCreated }: { onCreated?: () => void }) {
  const [form, setForm] = React.useState({
    sku: "",
    name: "",
    description: "",
    purchasePrice: "",
    salePrice: "",
    providerName: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await createProduct({
        sku: form.sku,
        name: form.name,
        description: form.description || undefined,
        purchasePrice: Number(form.purchasePrice),
        salePrice: Number(form.salePrice),
        providerName: form.providerName || undefined
      });
      setForm({ sku: "", name: "", description: "", purchasePrice: "", salePrice: "", providerName: "" });
      onCreated && onCreated();
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
      <h2>Crear producto</h2>
      <input name="sku" value={form.sku} onChange={handleChange} placeholder="SKU" required />
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" required />
      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Descripción" />
      <input name="purchasePrice" value={form.purchasePrice} onChange={handleChange} placeholder="Precio compra" type="number" step="0.01" required />
      <input name="salePrice" value={form.salePrice} onChange={handleChange} placeholder="Precio venta" type="number" step="0.01" required />
      <input name="providerName" value={form.providerName} onChange={handleChange} placeholder="Proveedor (nombre)" />
      <div>
        <button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar producto"}</button>
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
}
