"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Package, Loader2, X, AlertCircle } from "lucide-react";
import classNames from "classnames";
import { apiGet, getApiErrorMessage } from "@/lib/api";
import { fetchAllProducts } from "@/lib/productsApi";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StockIndicator } from "./QuantitySelector";
import { useSearch } from "@/lib/useSearch";
import type { Product, CategoryOption, BrandOption } from "@/types/sale";
import { formatCurrency } from "@/types/sale";

interface ProductSearchProps {
  onProductSelect: (product: Product) => void;
  maxResults?: number;
  showQuickAdd?: boolean;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  onProductSelect,
  maxResults = 50,
  showQuickAdd = true,
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterBrand, setFilterBrand] = useState("all");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchFields = useMemo(
    () => ["name", "categories.name", "brands.name", "models.name"] as (keyof Product | string)[],
    []
  );

  const { query, setQuery, items: searchResults, clearSearch, totalResults } = useSearch<Product>(allProducts, {
    fields: searchFields,
    debounceMs: 200,
    keepResultsOnEmpty: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [products, catRes, brandRes] = await Promise.all([
          fetchAllProducts({ status: "active" }),
          apiGet<CategoryOption[]>("/api/categories"),
          apiGet<BrandOption[]>("/api/brands"),
        ]);
        if (cancelled) return;
        setAllProducts(products);
        setCategories(Array.isArray(catRes) ? catRes : []);
        setBrands(Array.isArray(brandRes) ? brandRes : []);
        if (products.length === 0) setError("No products found. Check your connection or try refreshing.");
      } catch (err) {
        if (cancelled) return;
        setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let r = searchResults;
    if (filterCategory !== "all") r = r.filter((p) => (p as any).categories?.id === filterCategory);
    if (filterBrand !== "all") r = r.filter((p) => (p as any).brands?.id === filterBrand);
    return r;
  }, [searchResults, filterCategory, filterBrand]);

  const displayed = filtered.slice(0, maxResults);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && displayed.length > 0) {
      e.preventDefault();
      onProductSelect(displayed[0]);
    }
  };
  const handleClear = () => {
    clearSearch();
    searchInputRef.current?.focus();
  };
  const clearFilters = () => {
    setFilterCategory("all");
    setFilterBrand("all");
    clearSearch();
  };
  const hasFilters = filterCategory !== "all" || filterBrand !== "all";

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products by name, category, brand, model..."
          className={classNames("input pl-12 pr-10 h-12 text-base focus:ring-2 focus:ring-primary/20")}
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={classNames(
            "text-sm font-medium transition-colors",
            showFilters ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
          {hasFilters && (
            <Badge variant="primary" size="sm" className="ml-2">
              Active
            </Badge>
          )}
        </button>
        <span className="text-xs text-muted-foreground">
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading products...
            </span>
          ) : (
            `${filtered.length}${filtered.length !== allProducts.length ? ` of ${allProducts.length}` : ""} products`
          )}
        </span>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input h-10 text-sm w-full">
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Brand</label>
            <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="input h-10 text-sm w-full">
              <option value="all">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <div className="col-span-2">
              <button onClick={clearFilters} className="text-xs text-primary hover:text-primary/80 font-medium">
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {loading && allProducts.length === 0 ? (
          <div className="py-12">
            <LoadingSpinner text="Loading products..." />
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState
            title={query ? `No results for "${query}"` : "No products found"}
            description={
              query
                ? "Try a different search term or adjust filters"
                : hasFilters
                ? "No products match the selected filters"
                : "No products available"
            }
          />
        ) : (
          displayed.map((product) => (
            <div
              key={product.id}
              className={classNames(
                "group flex items-center justify-between rounded-xl border border-border p-3 transition-all duration-200",
                "hover:border-primary/30 hover:bg-primary/5 hover:shadow-sm",
                product.quantity <= 0 && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-14 w-14 overflow-hidden rounded-lg bg-muted/50 flex-shrink-0">
                  {product.image_url || product.models?.image_url ? (
                    <img
                      src={product.image_url || product.models?.image_url || ""}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Package className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {[product.categories?.name, product.brands?.name].filter(Boolean).join(" • ") || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-semibold text-sm">{formatCurrency(product.price)}</span>
                    <StockIndicator quantity={product.quantity} />
                  </div>
                </div>
              </div>
              {showQuickAdd && (
                <Button
                  variant={product.quantity > 0 ? "primary" : "outline"}
                  size="sm"
                  onClick={() => onProductSelect(product)}
                  disabled={product.quantity <= 0}
                  className="flex-shrink-0 ml-3"
                >
                  Add
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {displayed.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Press Enter to add the first result, or click Add
        </p>
      )}
    </div>
  );
};
