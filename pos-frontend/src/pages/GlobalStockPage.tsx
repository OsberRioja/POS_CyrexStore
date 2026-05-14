import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Download, PackageSearch, Search } from "lucide-react";
import PaginationControls from "../components/PaginationControls";
import { useDebounce } from "../hooks/useDebounce";
import { productService } from "../services/productService";
import type { GlobalStockParams, GlobalStockProduct } from "../services/productService";

const PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 5;

type SortBy = NonNullable<GlobalStockParams["sortBy"]>;
type SortDir = NonNullable<GlobalStockParams["sortDir"]>;

const stockBadgeClass = (stock: number) => {
  if (stock === 0) return "bg-red-100 text-red-700 border-red-200";
  if (stock <= LOW_STOCK_THRESHOLD) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const getBranchStock = (product: GlobalStockProduct, branchId: number) =>
  product.branches.find((branch) => branch.branchId === branchId)?.stock ?? 0;

export default function GlobalStockPage() {
  const [items, setItems] = useState<GlobalStockProduct[]>([]);
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 350);

  const globalStock = useMemo(
    () => items.reduce((total, product) => total + product.totalStock, 0),
    [items]
  );

  const loadGlobalStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getGlobalStock({
        q: debouncedQuery || undefined,
        category: category || undefined,
        brand: brand || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortDir,
      });

      setItems(response.data.data);
      setBranches(response.data.branches);
      setCategories(response.data.metadata.categories);
      setBrands(response.data.metadata.brands);
      setTotalItems(response.data.pagination.totalItems);
      setTotalPages(response.data.pagination.totalPages);
      setPage(response.data.pagination.page);
    } catch (err: any) {
      console.error("Error cargando stock global", err);
      setError(err?.response?.data?.error || "No se pudo cargar el stock global.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalStock();
  }, [debouncedQuery, category, brand, page, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category, brand, sortBy, sortDir]);

  const toggleSort = (nextSortBy: SortBy) => {
    if (sortBy === nextSortBy) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextSortBy);
    setSortDir(nextSortBy === "totalStock" ? "desc" : "asc");
  };

  const exportCsv = () => {
    const headers = [
      "Código interno",
      "SKU",
      "Producto",
      "Categoría",
      "Marca",
      ...branches.map((branch) => branch.name),
      "Total global",
    ];

    const rows = items.map((product) => [
      product.codigoInterno,
      product.sku ?? "",
      product.name,
      product.category ?? "",
      product.brand ?? "",
      ...branches.map((branch) => String(getBranchStock(product, branch.id))),
      String(product.totalStock),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "stock-global.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const SortButton = ({ field, label }: { field: SortBy; label: string }) => (
    <button
      type="button"
      onClick={() => toggleSort(field)}
      className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-700"
    >
      {label}
      <ArrowUpDown size={14} className={sortBy === field ? "text-blue-600" : "text-slate-400"} />
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
              <PackageSearch size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Stock Global</h2>
              <p className="text-sm text-gray-500">
                Vista consolidada para comparar inventario entre todas las sucursales activas.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Total visible</p>
          <p className="text-2xl font-bold text-blue-900">{globalStock}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre, SKU o código interno"
            className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas las categorías</option>
          {categories.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>

        <select
          value={brand}
          onChange={(event) => setBrand(event.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Todas las marcas</option>
          {brands.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={exportCsv}
          disabled={!items.length}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="sticky left-0 z-10 min-w-[130px] border-b border-r border-slate-200 bg-slate-100 p-3 text-left">
                  <SortButton field="codigoInterno" label="Código" />
                </th>
                <th className="min-w-[120px] border-b border-slate-200 p-3 text-left">
                  <SortButton field="sku" label="SKU" />
                </th>
                <th className="min-w-[240px] border-b border-slate-200 p-3 text-left">
                  <SortButton field="name" label="Producto" />
                </th>
                <th className="min-w-[150px] border-b border-slate-200 p-3 text-left">
                  <SortButton field="category" label="Categoría" />
                </th>
                <th className="min-w-[140px] border-b border-slate-200 p-3 text-left">
                  <SortButton field="brand" label="Marca" />
                </th>
                {branches.map((branch) => (
                  <th key={branch.id} className="min-w-[130px] border-b border-slate-200 p-3 text-center font-semibold text-slate-700">
                    {branch.name}
                  </th>
                ))}
                <th className="sticky right-0 z-10 min-w-[120px] border-b border-l border-slate-200 bg-blue-50 p-3 text-center">
                  <SortButton field="totalStock" label="Total" />
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6 + branches.length} className="p-8 text-center text-slate-500">
                    Cargando stock global...
                  </td>
                </tr>
              )}

              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6 + branches.length} className="p-8 text-center text-slate-500">
                    No hay productos para los filtros seleccionados.
                  </td>
                </tr>
              )}

              {!loading && items.map((product) => (
                <tr key={`${product.codigoInterno}-${product.sku ?? product.name}`} className="hover:bg-slate-50">
                  <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white p-3 font-mono text-xs text-slate-700">
                    {product.codigoInterno}
                  </td>
                  <td className="border-b border-slate-100 p-3 text-slate-600">{product.sku || "-"}</td>
                  <td className="border-b border-slate-100 p-3 font-semibold text-slate-900">{product.name}</td>
                  <td className="border-b border-slate-100 p-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {product.category || "Sin categoría"}
                    </span>
                  </td>
                  <td className="border-b border-slate-100 p-3 text-slate-600">{product.brand || "-"}</td>
                  {branches.map((branch) => {
                    const stock = getBranchStock(product, branch.id);
                    return (
                      <td key={branch.id} className="border-b border-slate-100 p-3 text-center">
                        <span className={`inline-flex min-w-10 justify-center rounded-full border px-3 py-1 text-xs font-bold ${stockBadgeClass(stock)}`}>
                          {stock}
                        </span>
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 border-b border-l border-slate-100 bg-blue-50 p-3 text-center">
                    <span className="inline-flex min-w-12 justify-center rounded-xl bg-blue-600 px-3 py-1 font-bold text-white shadow-sm">
                      {product.totalStock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && totalItems > 0 && (
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
