const BASE = import.meta.env.VITE_API_URL || "/api";

export async function fetchProducts() {
  const token = localStorage.getItem('token');
  const r = await fetch(`${BASE}/products`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!r.ok) throw new Error("Error fetching products");
  return r.json();
}

export async function createProduct(payload: any) {
  const token = localStorage.getItem('token');
  const r = await fetch(`${BASE}/products`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error creating product");
  return data;
}