"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Search, Edit3, Loader2, ChevronLeft, ChevronRight, Filter, X, Package, AlertTriangle, CheckCircle, TrendingUp, RefreshCw } from "lucide-react";
import { apiGet, apiPut, getApiErrorMessage } from "@/lib/api";
import { fetchAllProducts } from "@/lib/productsApi";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { useSearch } from "@/lib/useSearch";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types/sale";

const PRODUCTS_PER_PAGE = 50;

export default function AdminInventoryPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { push } = useToast();

  const searchFields = useMemo(() => [
    "name",
    "categories.name",
    "brands.name",
  ] as (keyof Product | string)[], []);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    items: searchedProducts,
    clearSearch,
  } = useSearch<Product>(allProducts, {
    fields: searchFields,
    debounceMs: 200,
    keepResultsOnEmpty: true,
  });

  const filteredProducts = useMemo(() => {
    let result = searchedProducts;
    if (filterCategory) {
      result = result.filter((p) => p.category_id === filterCategory);
    }
    if (filterBrand) {
      result = result.filter((p) => p.brand_id === filterBrand);
    }
    return result;
  }, [searchedProducts, filterCategory, filterBrand]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((page - 1) * PRODUCTS_PER_PAGE, page * PRODUCTS_PER_PAGE);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [products, catRes, brandRes] = await Promise.all([
        fetchAllProducts({ status: "active" }),
        apiGet("/categories"),
        apiGet("/brands"),
      ]);

      setAllProducts(products);
      setCategories(Array.isArray(catRes) ? catRes : []);
      setBrands(Array.isArray(brandRes) ? brandRes : []);
    } catch (err) {
      console.error("[Inventory] Load failed:", err);
      push(getApiErrorMessage(err), "error");
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [searchQuery, filterCategory, filterBrand]);

  const openEdit = (item: Product) => {
    setEditing(item);
    setEditQuantity(String(item.quantity));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await apiPut(`/products/${editing.id}`, { quantity: Number(editQuantity) });
      setAllProducts((prev) => prev.map((item) =>
        item.id === editing.id ? { ...item, quantity: Number(editQuantity) } : item
      ));
      setEditOpen(false);
      setEditing(null);
      push("Quantity updated successfully", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    clearSearch();
    setFilterCategory("");
    setFilterBrand("");
    setPage(1);
  };

  const hasFilters = !!(searchQuery || filterCategory || filterBrand);

  const lowStock = allProducts.filter((item) => item.quantity <= 5 && item.quantity > 0).length;
  const outOfStock = allProducts.filter((item) => item.quantity === 0).length;
  const inStock = allProducts.filter((item) => item.quantity > 5).length;

  const startItem = filteredProducts.length > 0 ? (page - 1) * PRODUCTS_PER_PAGE + 1 : 0;
  const endItem = Math.min(page * PRODUCTS_PER_PAGE, filteredProducts.length);

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { variant: "destructive" as const, label: "Out of Stock" };
    if (quantity <= 5) return { variant: "warning" as const, label: "Low Stock" };
    return { variant: "success" as const, label: "In Stock" };
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Inventory"
        subtitle="Manage product stock levels and track inventory"
        meta={<>{allProducts.length} products loaded</>}
        actions={
          <Button variant="primary" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={allProducts.length} subtitle="In catalog" icon={<Package className="h-5 w-5" />} variant="primary" />
        <StatCard title="In Stock" value={inStock} subtitle="Available items" icon={<CheckCircle className="h-5 w-5" />} variant="success" />
        <StatCard title="Low Stock" value={lowStock} subtitle="Need restocking" icon={<TrendingUp className="h-5 w-5" />} variant="warning" />
        <StatCard title="Out of Stock" value={outOfStock} subtitle="Unavailable" icon={<AlertTriangle className="h-5 w-5" />} variant="destructive" />
      </div>

      {(outOfStock > 0 || lowStock > 0) && (
        <Card className="bg-gradient-to-r from-destructive/5 via-warning/5 to-success/5 border-destructive/20">
          <div className="flex flex-wrap items-center gap-4">
            {outOfStock > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-destructive">Out of stock: {outOfStock}</p>
                  <p className="text-xs text-muted-foreground">Immediate attention needed</p>
                </div>
              </div>
            )}
            {lowStock > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
                  <TrendingUp className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-warning">Low stock: {lowStock}</p>
                  <p className="text-xs text-muted-foreground">Consider restocking soon</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="input pl-11 pr-10"
              placeholder="Search products by name, category, brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button variant={showFilters || hasFilters ? "primary" : "outline"} onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {(filterCategory || filterBrand) && (
              <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {(filterCategory ? 1 : 0) + (filterBrand ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[{ value: "", label: "All Categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
              />
              <Select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                options={[{ value: "", label: "All Brands" }, ...brands.map((b) => ({ value: b.id, label: b.name }))]}
              />
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-destructive hover:text-destructive">
                  <X className="mr-1.5 h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {loading && allProducts.length === 0 ? (
        <Card className="p-8">
          <PageLoading text="Loading inventory..." />
        </Card>
      ) : paginatedProducts.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No products found"
            description={hasFilters ? "Try adjusting your search or filters." : "Add products to your inventory."}
          />
        </Card>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th className="pl-5">Product</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th className="text-center">Quantity</th>
                  <th className="text-center">Status</th>
                  <th className="text-right pr-5">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((item) => {
                  const status = getStockStatus(item.quantity);
                  return (
                    <tr key={item.id}>
                      <td className="pl-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <span className="font-medium line-clamp-1 max-w-[200px]">{item.name}</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground">{item.categories?.name || "\u2014"}</td>
                      <td className="text-muted-foreground">{item.brands?.name || "\u2014"}</td>
                      <td className="text-center"><span className="font-semibold">{item.quantity}</span></td>
                      <td className="text-center"><Badge variant={status.variant}>{status.label}</Badge></td>
                      <td className="text-right pr-5">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          <Edit3 className="mr-1.5 h-4 w-4" /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <Card className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
                <span className="font-medium text-foreground">{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{filteredProducts.length}</span>
                {hasFilters && <span> (filtered from {allProducts.length})</span>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <Button key={pageNum} variant={page === pageNum ? "primary" : "ghost"} size="sm" onClick={() => setPage(pageNum)} className="w-9">
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Quantity">
        <div className="space-y-5">
          {editing && (
            <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                {editing.image_url ? (
                  <img src={editing.image_url} alt={editing.name} className="h-full w-full object-cover" />
                ) : (
                  <Package className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold">{editing.name}</p>
                <p className="text-sm text-muted-foreground">
                  {editing.categories?.name || "\u2014"} {editing.brands?.name ? `\u2022 ${editing.brands.name}` : ""}
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium">Quantity</label>
            <Input type="number" min="0" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} autoFocus />
          </div>
          <Button variant="primary" onClick={saveEdit} disabled={saving} className="w-full">
            {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : "Save Changes"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
