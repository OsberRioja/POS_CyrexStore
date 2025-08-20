const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function fetchProducts() {
  const r = await fetch(`${BASE}/products`);
  if (!r.ok) throw new Error("Error fetching products");
  return r.json();
}

export async function createProduct(payload: any) {
  const r = await fetch(`${BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error creating product");
  return data;
}
