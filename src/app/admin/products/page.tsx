"use client";

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight, Filter, X, Loader2, Upload, Download, Package } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, getApiErrorMessage } from "@/lib/api";
import { ProductCardSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StickyActionBar } from "@/components/ui/StickyActionBar";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { GalleryUploader, type GalleryItem } from "@/components/ui/GalleryUploader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { fetchAllProducts } from "@/lib/productsApi";
import { useSearch } from "@/lib/useSearch";
import type { Product } from "@/types/sale";

type Option = { id: string; name?: string; label?: string; brand_id?: string; years?: string[] };

export default function AdminProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearId, setYearId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const { push } = useToast();
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addBrandOpen, setAddBrandOpen] = useState(false);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newModelBrandId, setNewModelBrandId] = useState("");
  const [newYear, setNewYear] = useState("");
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Option | null>(null);

  const [page, setPage] = useState(1);
  const PRODUCTS_PER_PAGE = 24;

  const visibleFilterModels = useMemo(() => {
    if (!filterBrand) return models;
    return models.filter((m) => String(m.brand_id) === filterBrand);
  }, [models, filterBrand]);

  const availableYears = useMemo(() => {
    if (!selectedModel) return years;
    return years.filter((y) => selectedModel.years?.includes(y.label || ""));
  }, [years, selectedModel]);

  const searchFields = useMemo(() => [
    "name",
    "categories.name",
    "brands.name",
    "models.name",
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

  const filteredByCategoryBrandModel = useMemo(() => {
    let result = searchedProducts;

    if (filterCategory) {
      result = result.filter((p) => p.category_id === filterCategory);
    }
    if (filterBrand) {
      result = result.filter((p) => p.brand_id === filterBrand);
    }
    if (filterModel) {
      result = result.filter((p) => p.model_id === filterModel);
    }

    return result;
  }, [searchedProducts, filterCategory, filterBrand, filterModel]);

  const totalPages = Math.ceil(filteredByCategoryBrandModel.length / PRODUCTS_PER_PAGE);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const products = await fetchAllProducts();
      setAllProducts(products);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load products:", err);
      push(getApiErrorMessage(err), "error");
      setAllProducts([]);
    } finally {
      setLoading(false);
    }
  }, [push]);

  const warmupRender = useCallback(async () => {
    try {
      await apiGet("/health", { timeout: 60000, skipRetry: true });
    } catch {
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        apiGet<Option[]>("/categories"),
        apiGet<Option[]>("/brands"),
        apiGet<Option[]>("/models"),
        apiGet<Option[]>("/years"),
      ]);
      if (results[0].status === "fulfilled") setCategories(results[0].value || []);
      if (results[1].status === "fulfilled") setBrands(results[1].value || []);
      if (results[2].status === "fulfilled") setModels(results[2].value || []);
      if (results[3].status === "fulfilled") setYears(results[3].value || []);
    } catch (err) {
      console.error("Failed to load options:", err);
    }
  }, []);

  useEffect(() => {
    warmupRender().then(() => {
      loadProducts();
      load();
    });
  }, [loadProducts, load, warmupRender]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterCategory, filterBrand, filterModel]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PRODUCTS_PER_PAGE;
    return filteredByCategoryBrandModel.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredByCategoryBrandModel, page]);

  const exportCsv = async () => {
    try {
      setExporting(true);
      const data = await apiGet<string>("/products/export");
      const blob = new Blob([data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products.csv";
      link.click();
      window.URL.revokeObjectURL(url);
      push("Export complete", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setExporting(false);
    }
  };

  const importCsv = async (file: File | null) => {
    if (!file) return;
    try {
      setImporting(true);
      const text = await file.text();
      await apiPost("/products/import", { csv: text });
      push("Products imported", "success");
      loadProducts();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      let finalYearId = yearId;

      if (yearId && selectedModel?.years?.includes(yearId)) {
        const existingYear = years.find((y) => y.label === yearId);
        if (existingYear) {
          finalYearId = existingYear.id;
        } else {
          const res = await apiPost<any>("/years", { label: yearId });
          finalYearId = res.id;
        }
      }

      const payload = {
        name,
        price: Number(price),
        quantity: Number(quantity),
        category_id: categoryId,
        brand_id: brandId || null,
        model_id: modelId || null,
        year_id: finalYearId || null,
        description,
        image_url: imageUrl || null,
        gallery: gallery,
        status: "active",
      };

      await apiPost("/products", payload);
      push("Product created successfully", "success");
      setOpen(false);
      resetForm();
      loadProducts();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setQuantity("");
    setCategoryId("");
    setBrandId("");
    setModelId("");
    setYearId("");
    setDescription("");
    setImageUrl("");
    setGallery([]);
  };

  const onOpenEdit = (product: Product) => {
    setEditing(product);
    setName(product.name);
    setPrice(String(product.price));
    setQuantity(String(product.quantity));
    setCategoryId(product.category_id || "");
    setBrandId(product.brand_id || "");
    setModelId(product.model_id || "");
    setYearId(product.year_id || "");
    setDescription(product.description || "");
    setImageUrl(product.image_url || "");
    setGallery(product.gallery || []);
    setEditOpen(true);
  };

  const createCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const res = await apiPost<any>("/categories", { name: newCategory });
      setCategories([...categories, res]);
      setNewCategory("");
      setAddCategoryOpen(false);
      push("Category created", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const createBrand = async () => {
    if (!newBrand.trim()) return;
    try {
      const res = await apiPost<any>("/brands", { name: newBrand });
      setBrands([...brands, res]);
      setNewBrand("");
      setAddBrandOpen(false);
      push("Brand created", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const createModel = async () => {
    if (!newModel.trim() || !newModelBrandId) return;
    try {
      const res = await apiPost<any>("/models", { name: newModel, brand_id: newModelBrandId });
      setModels([...models, res]);
      setNewModel("");
      setAddModelOpen(false);
      push("Model created", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const createYear = async () => {
    if (!newYear.trim()) return;
    try {
      const res = await apiPost<any>("/years", { label: newYear });
      setYears([...years, res]);
      setNewYear("");
      setAddYearOpen(false);
      push("Year created", "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || submitting) return;
    setSubmitting(true);
    try {
      let finalYearId = yearId;

      if (yearId && selectedModel?.years?.includes(yearId)) {
        const existingYear = years.find((y) => y.label === yearId);
        if (existingYear) {
          finalYearId = existingYear.id;
        } else {
          const res = await apiPost<any>("/years", { label: yearId });
          finalYearId = res.id;
        }
      }

      const payload = {
        name,
        price: Number(price),
        quantity: Number(quantity),
        category_id: categoryId,
        brand_id: brandId || null,
        model_id: modelId || null,
        year_id: finalYearId || null,
        description,
        image_url: imageUrl || null,
        gallery: gallery,
        status: editing.status || "active",
      };

      await apiPut(`/products/${editing.id}`, payload);
      push("Product updated successfully", "success");
      setEditOpen(false);
      setEditing(null);
      resetForm();
      loadProducts();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiDelete(`/products/${id}`);
      push("Product deleted", "success");
      loadProducts();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    clearSearch();
    setFilterCategory("");
    setFilterBrand("");
    setFilterModel("");
    setPage(1);
  };

  const hasActiveFilters = filterCategory || filterBrand || filterModel || searchQuery;

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (quantity <= 5) return <Badge variant="warning">Low Stock</Badge>;
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Products"
        subtitle={`${filteredByCategoryBrandModel.length} products found`}
        meta={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => importCsv(e.target.files?.[0] || null)}
            />
            <Button variant="outline" size="sm" onClick={() => importInputRef.current?.click()} disabled={importing}>
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        }
      />

      <Card padding="md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="input pl-11"
                placeholder="Search by name, category, brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => clearSearch()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button
            variant={showFilters || hasActiveFilters ? "primary" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {(filterCategory || filterBrand || filterModel || searchQuery) && (
              <span className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                {[filterCategory, filterBrand, filterModel, searchQuery].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{paginatedProducts.length}</span> of{" "}
          <span className="font-semibold text-foreground">{filteredByCategoryBrandModel.length}</span> products
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-in-down">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                options={[
                  { value: "", label: "All categories" },
                  ...categories.map((c) => ({ value: c.id, label: c.name || "" })),
                ]}
              />
              <Select
                value={filterBrand}
                onChange={(e) => { setFilterBrand(e.target.value); setFilterModel(""); }}
                options={[
                  { value: "", label: "All brands" },
                  ...brands.map((b) => ({ value: b.id, label: b.name || "" })),
                ]}
              />
              <Select
                value={filterModel}
                onChange={(e) => setFilterModel(e.target.value)}
                options={[
                  { value: "", label: "All models" },
                  ...visibleFilterModels.map((m) => ({ value: m.id, label: m.name || "" })),
                ]}
                disabled={!filterBrand}
              />
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ) : filteredByCategoryBrandModel.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="No products found"
            description={hasActiveFilters ? "Try adjusting your filters or search." : "Add your first product to get started."}
            action={
              <Button variant="primary" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((p, index) => {
              const imgSrc = p.model_id ? p.models?.image_url : p.image_url;
              return (
                <Card
                  key={p.id}
                  hover
                  className="overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6" />
                          </div>
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {getStockBadge(p.quantity)}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          {p.categories?.name || "Uncategorized"}
                          {p.brands?.name && ` • ${p.brands.name}`}
                        </p>
                        <h3 className="font-semibold text-sm line-clamp-2 mt-1">{p.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-lg font-bold">GHS {p.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Qty: {p.quantity}</p>
                      </div>
                      <Badge variant="muted">{p.status}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onOpenEdit(p)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Card className="flex flex-col items-center justify-between gap-4 p-4 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-9"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="Add New Product" size="lg">
        <form onSubmit={onCreate} className="space-y-5">
          <Input
            label="Product Name"
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { value: "", label: "Select category" },
                ...categories.map((c) => ({ value: c.id, label: c.name || "" })),
              ]}
            />
            <Button type="button" variant="outline" onClick={() => setAddCategoryOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>

            <Select
              label="Brand (Optional)"
              value={brandId}
              onChange={(e) => { setBrandId(e.target.value); setModelId(""); }}
              options={[
                { value: "", label: "Select brand" },
                ...brands.map((b) => ({ value: b.id, label: b.name || "" })),
              ]}
            />
            <Button type="button" variant="outline" onClick={() => setAddBrandOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Button>

            <Select
              label="Model (Optional)"
              value={modelId}
              onChange={(e) => { setModelId(e.target.value); setYearId(""); }}
              options={[
                { value: "", label: "Select model" },
                ...models.filter((m) => !brandId || String(m.brand_id) === brandId).map((m) => ({ value: m.id, label: m.name || "" })),
              ]}
            />
            <Button type="button" variant="outline" onClick={() => setAddModelOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Model
            </Button>

            <Select
              label="Year (Optional)"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
              options={[
                { value: "", label: "Select year" },
                ...availableYears.map((y) => ({ value: y.id, label: y.label || "" })),
              ]}
            />
            {!selectedModel?.years?.length && (
              <Button type="button" variant="outline" onClick={() => setAddYearOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Year
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Enter product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            endpoint="/products/upload"
            label="Product Image"
          />

          <GalleryUploader
            value={gallery}
            onChange={setGallery}
            label="Product Gallery (Images & Videos)"
          />

          <StickyActionBar>
            <Button type="submit" variant="primary" loading={submitting} className="w-full">
              Create Product
            </Button>
          </StickyActionBar>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditing(null); resetForm(); }} title="Edit Product" size="lg">
        <form onSubmit={onUpdate} className="space-y-5">
          <Input
            label="Product Name"
            placeholder="Enter product name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[
                { value: "", label: "Select category" },
                ...categories.map((c) => ({ value: c.id, label: c.name || "" })),
              ]}
            />
            <Select
              label="Brand"
              value={brandId}
              onChange={(e) => { setBrandId(e.target.value); setModelId(""); }}
              options={[
                { value: "", label: "Select brand" },
                ...brands.map((b) => ({ value: b.id, label: b.name || "" })),
              ]}
            />
            <Select
              label="Model"
              value={modelId}
              onChange={(e) => { setModelId(e.target.value); setYearId(""); }}
              options={[
                { value: "", label: "Select model" },
                ...models.filter((m) => !brandId || String(m.brand_id) === brandId).map((m) => ({ value: m.id, label: m.name || "" })),
              ]}
            />
            <Select
              label="Year"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
              options={[
                { value: "", label: "Select year" },
                ...availableYears.map((y) => ({ value: y.id, label: y.label || "" })),
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Enter product description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            endpoint="/products/upload"
            label="Product Image"
          />

          <GalleryUploader
            value={gallery}
            onChange={setGallery}
            label="Product Gallery (Images & Videos)"
          />

          <StickyActionBar>
            <Button type="submit" variant="primary" loading={submitting} className="w-full">
              Save Changes
            </Button>
          </StickyActionBar>
        </form>
      </Modal>

      <Modal open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} title="Add Category">
        <div className="space-y-4">
          <Input
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <Button variant="primary" onClick={createCategory} className="w-full">
            Save Category
          </Button>
        </div>
      </Modal>

      <Modal open={addBrandOpen} onClose={() => setAddBrandOpen(false)} title="Add Brand">
        <div className="space-y-4">
          <Input
            placeholder="Brand name"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
          />
          <Button variant="primary" onClick={createBrand} className="w-full">
            Save Brand
          </Button>
        </div>
      </Modal>

      <Modal open={addModelOpen} onClose={() => setAddModelOpen(false)} title="Add Model">
        <div className="space-y-4">
          <Input
            placeholder="Model name"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
          />
          <Select
            value={newModelBrandId}
            onChange={(e) => setNewModelBrandId(e.target.value)}
            options={[
              { value: "", label: "Select brand" },
              ...brands.map((b) => ({ value: b.id, label: b.name || "" })),
            ]}
          />
          <Button variant="primary" onClick={createModel} className="w-full">
            Save Model
          </Button>
        </div>
      </Modal>

      <Modal open={addYearOpen} onClose={() => setAddYearOpen(false)} title="Add Year">
        <div className="space-y-4">
          <Input
            placeholder="Year (e.g. 2022)"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
          />
          <Button variant="primary" onClick={createYear} className="w-full">
            Save Year
          </Button>
        </div>
      </Modal>
    </div>
  );
}
