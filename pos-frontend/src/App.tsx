import React from "react";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";

export default function App() {
  const [refreshKey, setRefreshKey] = React.useState(0);
  return (
    <div style={{ maxWidth: 900, margin: "20px auto", fontFamily: "Inter, sans-serif" }}>
      <h1>POS - Productos</h1>
      <ProductForm onCreated={() => setRefreshKey(k => k + 1)} />
      <hr />
      <ProductList key={refreshKey} />
    </div>
  );
}
