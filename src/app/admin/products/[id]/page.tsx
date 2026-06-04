"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  Video,
  X,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  Minus,
  Save,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Box,
  Tag,
  Calendar,
  Hash,
  RefreshCw,
} from "lucide-react";
import { apiGet, apiPut, apiDelete, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { GalleryUploader, type GalleryItem } from "@/components/ui/GalleryUploader";

type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  image_url?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  year_id?: string | null;
  gallery?: GalleryItem[];
  status?: "active" | "inactive";
  cost_price?: number | null;
  categories?: { name: string };
  brands?: { name: string };
  models?: { name: string; image_url?: string | null; gallery?: string[] };
  years?: { id: string; label: string };
  created_at?: string;
  updated_at?: string;
};

type Option = { id: string; name?: string; label?: string; brand_id?: string; years?: string[] };

type EditForm = {
  name: string;
  description: string;
  price: string;
  cost_price: string;
  quantity: string;
  status: "active" | "inactive";
  category_id: string;
  brand_id: string;
  model_id: string;
  year_id: string;
  image_url: string;
  gallery: GalleryItem[];
};

const emptyForm: EditForm = {
  name: "",
  description: "",
  price: "",
  cost_price: "",
  quantity: "",
  status: "active",
  category_id: "",
  brand_id: "",
  model_id: "",
  year_id: "",
  image_url: "",
  gallery: [],
};

export default function AdminProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdminProductDetailInner id={id} />;
}

function AdminProductDetailInner({ id }: { id: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightbox, setLightbox] = useState<{ index: number; items: GalleryItem[] } | null>(null);

  const [stockModal, setStockModal] = useState<{ open: boolean; delta: string; reason: string }>({
    open: false,
    delta: "",
    reason: "",
  });
  const [stockSubmitting, setStockSubmitting] = useState(false);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(emptyForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<AdminProduct>(`/api/products/${id}`);
      setProduct(data);
      setActiveImageIndex(0);
    } catch (err) {
      console.error("Failed to load product:", err);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.allSettled([
          apiGet<Option[]>("/api/categories"),
          apiGet<Option[]>("/api/brands"),
          apiGet<Option[]>("/api/models"),
          apiGet<Option[]>("/api/years"),
        ]);
        if (results[0].status === "fulfilled") setCategories(results[0].value || []);
        if (results[1].status === "fulfilled") setBrands(results[1].value || []);
        if (results[2].status === "fulfilled") setModels(results[2].value || []);
        if (results[3].status === "fulfilled") setYears(results[3].value || []);
      } catch (err) {
        console.error("Failed to load options:", err);
      }
    })();
  }, []);

  const galleryItems: GalleryItem[] = useMemo(() => {
    if (!product) return [];
    const items: GalleryItem[] = [];
    const seen = new Set<string>();

    const addItem = (url: string | null | undefined, type: "image" | "video") => {
      if (!url || seen.has(url)) return;
      seen.add(url);
      items.push({ url, type });
    };

    const mainImg = product.model_id ? product.models?.image_url : product.image_url;
    addItem(mainImg, "image");

    if (Array.isArray(product.gallery)) {
      for (const item of product.gallery) {
        if (item?.url) addItem(item.url, item.type || "image");
      }
    }

    if (product.models?.gallery && Array.isArray(product.models.gallery)) {
      for (const url of product.models.gallery) {
        addItem(url, "image");
      }
    }

    if (product.image_url && !seen.has(product.image_url)) {
      addItem(product.image_url, "image");
    }

    return items;
  }, [product]);

  const displayItem = galleryItems[activeImageIndex] || null;

  const stockStatus =
    !product || product.quantity === 0
      ? { variant: "destructive" as const, label: "Out of Stock" }
      : product.quantity <= 5
      ? { variant: "warning" as const, label: "Low Stock" }
      : { variant: "success" as const, label: "In Stock" };

  const margin =
    product && product.cost_price && product.cost_price > 0
      ? ((product.price - product.cost_price) / product.cost_price) * 100
      : null;

  const profit = product && product.cost_price != null ? product.price - product.cost_price : null;

  const visibleEditModels = useMemo(() => {
    if (!editForm.brand_id) return models;
    return models.filter((m) => String(m.brand_id) === editForm.brand_id);
  }, [models, editForm.brand_id]);

  const selectedModel = useMemo(
    () => models.find((m) => m.id === editForm.model_id) || null,
    [models, editForm.model_id]
  );

  const availableYears = useMemo(() => {
    if (!selectedModel) return years;
    return years.filter((y) => selectedModel.years?.includes(y.label || ""));
  }, [years, selectedModel]);

  const onOpenEdit = () => {
    if (!product) return;
    setEditForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      cost_price: product.cost_price != null ? String(product.cost_price) : "",
      quantity: String(product.quantity),
      status: product.status || "active",
      category_id: product.category_id || "",
      brand_id: product.brand_id || "",
      model_id: product.model_id || "",
      year_id: product.year_id || "",
      image_url: product.image_url || "",
      gallery: product.gallery || [],
    });
    setEditError(null);
    setEditOpen(true);
  };

  const onSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (editSubmitting) return;
    setEditError(null);

    if (!editForm.name.trim()) {
      setEditError("Product name is required");
      return;
    }
    const priceNum = parseFloat(editForm.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setEditError("Price must be a positive number");
      return;
    }
    const qtyNum = parseInt(editForm.quantity, 10);
    if (Number.isNaN(qtyNum) || qtyNum < 0) {
      setEditError("Quantity must be a non-negative integer");
      return;
    }
    const costNum = editForm.cost_price.trim() === "" ? null : parseFloat(editForm.cost_price);
    if (costNum != null && (Number.isNaN(costNum) || costNum < 0)) {
      setEditError("Cost price must be a positive number or empty");
      return;
    }

    setEditSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
        price: priceNum,
        cost_price: costNum,
        quantity: qtyNum,
        status: editForm.status,
        category_id: editForm.category_id,
        brand_id: editForm.brand_id || null,
        model_id: editForm.model_id || null,
        year_id: editForm.year_id || null,
        image_url: editForm.image_url || null,
        gallery: editForm.gallery,
      };

      await apiPut(`/api/products/${product.id}`, payload);
      push("Product updated", "success");
      setEditOpen(false);
      await load();
    } catch (err) {
      setEditError(getApiErrorMessage(err));
    } finally {
      setEditSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!product) return;
    if (deleting) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/products/${product.id}`);
      push("Product deleted", "success");
      router.push("/admin/products");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  const onToggleStatus = async () => {
    if (!product) return;
    if (statusSubmitting) return;
    setStatusSubmitting(true);
    try {
      const next = product.status === "active" ? "inactive" : "active";
      await apiPut(`/api/products/${product.id}`, { status: next });
      setProduct({ ...product, status: next });
      push(`Product ${next === "active" ? "activated" : "deactivated"}`, "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const onApplyStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    const deltaNum = parseInt(stockModal.delta, 10);
    if (Number.isNaN(deltaNum) || deltaNum === 0) {
      push("Enter a non-zero quantity (use a negative number to reduce stock)", "error");
      return;
    }
    if (stockSubmitting) return;
    setStockSubmitting(true);
    try {
      const next = Math.max(0, product.quantity + deltaNum);
      await apiPut(`/api/products/${product.id}`, { quantity: next });
      setProduct({ ...product, quantity: next });
      push(`Stock updated to ${next}`, "success");
      setStockModal({ open: false, delta: "", reason: "" });
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setStockSubmitting(false);
    }
  };

  const quickAdjust = async (delta: number) => {
    if (!product) return;
    try {
      const next = Math.max(0, product.quantity + delta);
      await apiPut(`/api/products/${product.id}`, { quantity: next });
      setProduct({ ...product, quantity: next });
      push(`Stock ${delta > 0 ? "increased" : "decreased"} to ${next}`, "success");
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Products
        </Link>
        <Card className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-bold">{error || "Product not found"}</h3>
            <Button variant="primary" onClick={load} className="mt-4">
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/admin/products" className="hover:text-foreground">
                Products
              </Link>
              <span>/</span>
              <span className="truncate max-w-[200px]">{product.name}</span>
            </div>
            <h1 className="text-2xl font-bold mt-0.5 truncate">{product.name}</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/product/${product.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-9 px-3 rounded-lg border border-border bg-background text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> View in Shop
          </Link>
          <Button variant="outline" size="sm" onClick={onToggleStatus} disabled={statusSubmitting}>
            {product.status === "active" ? "Deactivate" : "Activate"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteModal(true)}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <Card padding="none" className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              {displayItem ? (
                displayItem.type === "video" ? (
                  <video
                    src={displayItem.url}
                    className="w-full h-full object-contain"
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={displayItem.url}
                    alt={product.name}
                    className="w-full h-full object-contain p-4"
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-20 h-20 text-gray-300 dark:text-gray-600" />
                </div>
              )}

              {galleryItems.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === 0 ? galleryItems.length - 1 : prev - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveImageIndex((prev) =>
                        prev === galleryItems.length - 1 ? 0 : prev + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {galleryItems.length > 1 && (
                <button
                  onClick={() => setLightbox({ index: activeImageIndex, items: galleryItems })}
                  className="absolute right-4 top-4 w-10 h-10 rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60"
                  aria-label="View full size"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                </button>
              )}

              {displayItem?.type === "video" && (
                <div className="absolute left-4 top-4">
                  <span className="px-3 py-1.5 rounded-full bg-purple-600 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" /> Video
                  </span>
                </div>
              )}

              <div className="absolute left-4 top-4">
                <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
              </div>
              <div className="absolute left-4 top-12">
                <Badge variant={product.status === "active" ? "success" : "muted"}>
                  {product.status || "active"}
                </Badge>
              </div>
            </div>

            {galleryItems.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3 border-t border-border scrollbar-thin">
                {galleryItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex
                        ? "border-primary shadow-md shadow-primary/20"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    {item.type === "video" ? (
                      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                            <Video className="w-3.5 h-3.5 text-gray-800" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`${product.name} view ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {product.description && (
            <Card padding="md">
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">Description</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card padding="md">
            <div className="flex flex-wrap gap-2 mb-3">
              {product.categories?.name && (
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {product.categories.name}
                </span>
              )}
              {product.brands?.name && (
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
                  {product.brands.name}
                </span>
              )}
              {product.models?.name && (
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                  {product.models.name}
                </span>
              )}
              {product.years?.label && (
                <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
                  {product.years.label}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="w-4 h-4" /> Sale Price
                </div>
                <p className="text-2xl font-bold">GHS {product.price.toLocaleString()}</p>
              </div>

              {product.cost_price != null && (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" /> Cost Price
                    </div>
                    <p className="font-semibold">GHS {product.cost_price.toLocaleString()}</p>
                  </div>
                  {profit != null && (
                    <div className="flex items-center justify-between py-2 border-b border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {profit >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        Profit / Unit
                      </div>
                      <p
                        className={`font-semibold ${
                          profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        GHS {profit.toLocaleString()}
                        {margin != null && (
                          <span className="ml-2 text-xs">({margin.toFixed(1)}%)</span>
                        )}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Box className="w-4 h-4" /> Stock on Hand
                </div>
                <p className="text-lg font-semibold">{product.quantity}</p>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-4 h-4" /> Product ID
                </div>
                <p className="font-mono text-xs">{product.id}</p>
              </div>

              {product.created_at && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" /> Created
                  </div>
                  <p className="text-sm">{new Date(product.created_at).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onOpenEdit}
                  className="flex-1 sm:flex-none"
                >
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickAdjust(-1)}
                  disabled={product.quantity <= 0}
                >
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => quickAdjust(1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStockModal({ open: true, delta: "", reason: "" })}
                >
                  Adjust Stock…
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={editOpen}
        onClose={() => {
          if (!editSubmitting) {
            setEditOpen(false);
            setEditError(null);
          }
        }}
        title="Edit Product"
        size="lg"
      >
        <form onSubmit={onSubmitEdit} className="space-y-5">
          {editError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{editError}</p>
            </div>
          )}

          <Input
            label="Product Name"
            placeholder="Enter product name"
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={editForm.category_id}
              onChange={(e) => setEditForm((f) => ({ ...f, category_id: e.target.value }))}
              options={[
                { value: "", label: "Select category" },
                ...categories.map((c) => ({ value: c.id, label: c.name || "" })),
              ]}
            />
            <Select
              label="Brand"
              value={editForm.brand_id}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, brand_id: e.target.value, model_id: "", year_id: "" }))
              }
              options={[
                { value: "", label: "Select brand" },
                ...brands.map((b) => ({ value: b.id, label: b.name || "" })),
              ]}
            />
            <Select
              label="Model"
              value={editForm.model_id}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, model_id: e.target.value, year_id: "" }))
              }
              options={[
                { value: "", label: "Select model" },
                ...visibleEditModels.map((m) => ({ value: m.id, label: m.name || "" })),
              ]}
              disabled={!editForm.brand_id}
            />
            <Select
              label="Year"
              value={editForm.year_id}
              onChange={(e) => setEditForm((f) => ({ ...f, year_id: e.target.value }))}
              options={[
                { value: "", label: "Select year" },
                ...availableYears.map((y) => ({ value: y.id, label: y.label || "" })),
              ]}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Sale Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={editForm.price}
              onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
            <Input
              label="Cost Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              hint="Optional"
              value={editForm.cost_price}
              onChange={(e) => setEditForm((f) => ({ ...f, cost_price: e.target.value }))}
            />
            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              value={editForm.quantity}
              onChange={(e) => setEditForm((f) => ({ ...f, quantity: e.target.value }))}
              required
            />
          </div>

          <Select
            label="Status"
            value={editForm.status}
            onChange={(e) =>
              setEditForm((f) => ({ ...f, status: e.target.value as "active" | "inactive" }))
            }
            options={[
              { value: "active", label: "Active (visible to customers)" },
              { value: "inactive", label: "Inactive (hidden from customers)" },
            ]}
          />

          <Textarea
            label="Description"
            placeholder="Enter product description..."
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
          />

          <ImageUploader
            value={editForm.image_url}
            onChange={(url) => setEditForm((f) => ({ ...f, image_url: url }))}
            endpoint="/api/products/upload"
            label="Product Image"
          />

          <GalleryUploader
            value={editForm.gallery}
            onChange={(items) => setEditForm((f) => ({ ...f, gallery: items }))}
            label="Product Gallery (Images & Videos)"
          />

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              className="sm:flex-1"
              onClick={() => {
                if (!editSubmitting) {
                  setEditOpen(false);
                  setEditError(null);
                }
              }}
              disabled={editSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={editSubmitting}
              className="sm:flex-1"
            >
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={stockModal.open}
        onClose={() => setStockModal({ open: false, delta: "", reason: "" })}
        title="Adjust Stock"
      >
        <form onSubmit={onApplyStock} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Current stock: <span className="font-semibold text-foreground">{product.quantity}</span>
          </p>
          <Input
            label="Delta (use negative to reduce)"
            type="number"
            placeholder="e.g. 10 or -5"
            value={stockModal.delta}
            onChange={(e) => setStockModal((s) => ({ ...s, delta: e.target.value }))}
            required
          />
          <Textarea
            label="Reason (optional)"
            placeholder="e.g. restock from supplier, damaged goods"
            value={stockModal.reason}
            onChange={(e) => setStockModal((s) => ({ ...s, reason: e.target.value }))}
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStockModal({ open: false, delta: "", reason: "" })}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={stockSubmitting} className="flex-1">
              <Save className="mr-2 h-4 w-4" /> Apply
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete product?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-900 dark:text-red-100">
                This action cannot be undone.
              </p>
              <p className="text-red-700 dark:text-red-300 mt-1">
                The product will be soft-deleted. Cloudinary assets will be cleaned up in the
                background.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onDelete}
              loading={deleting}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </Modal>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {lightbox.items.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((l) =>
                    l ? { ...l, index: l.index === 0 ? l.items.length - 1 : l.index - 1 } : null
                  );
                }}
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white hover:bg-white/20 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((l) =>
                    l ? { ...l, index: l.index === l.items.length - 1 ? 0 : l.index + 1 } : null
                  );
                }}
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
          {lightbox.items[lightbox.index]?.type === "video" ? (
            <video
              src={lightbox.items[lightbox.index].url}
              className="max-h-[85vh] max-w-[90vw]"
              controls
              autoPlay
              playsInline
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={lightbox.items[lightbox.index]?.url}
              alt={`Gallery ${lightbox.index + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          )}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full bg-black/60 px-6 py-3 text-white">
            <span className="text-sm font-medium">
              {lightbox.index + 1} / {lightbox.items.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
