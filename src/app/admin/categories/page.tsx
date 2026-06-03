"use client";

import React from "react";
import { Plus, Search, Tag, Pencil, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, getApiErrorMessage } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { ImageUploader } from "@/components/ui/ImageUploader";

type Category = { id: string; name: string; image_url?: string | null; show_by_brand?: boolean };

export default function AdminCategoriesPage() {
  const [items, setItems] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [name, setName] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [showByBrand, setShowByBrand] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Category[]>("/categories");
      setItems(res);
      setLastUpdated(new Date());
    } catch (err) {
      push(getApiErrorMessage(err), "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [push]);

  React.useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setName("");
    setImageUrl("");
    setShowByBrand(true);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiPost("/categories", { name, image_url: imageUrl || null, show_by_brand: showByBrand });
      push("Category created", "success");
      resetForm();
      setOpen(false);
      load();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onOpenEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setImageUrl(category.image_url || "");
    setShowByBrand(category.show_by_brand !== false);
    setEditOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || submitting) return;
    setSubmitting(true);
    try {
      await apiPut(`/categories/${editing.id}`, { name, image_url: imageUrl || null, show_by_brand: showByBrand });
      push("Category updated", "success");
      setEditOpen(false);
      setEditing(null);
      resetForm();
      load();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this category? This may affect products using this category.");
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiDelete(`/categories/${id}`);
      push("Category deleted", "success");
      load();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Categories"
        subtitle="Organize product families for faster browsing."
        meta={
          <>
            {items.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
        actions={
          <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add category
          </button>
        }
      />

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="input pl-11"
            placeholder="Search categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2.5 py-1">
              Search: {query}
            </span>
          </div>
        ) : null}

        {loading ? (
          <PageLoading text="Loading categories..." />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No categories found"
              description="Try adjusting your search or add a new category."
              action={
                <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
                  Add category
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="card card-hover overflow-hidden p-0">
                <div className="relative h-32 w-full bg-muted">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">Product category</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        className="btn-outline h-9 w-9 p-0"
                        onClick={() => onOpenEdit(c)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="btn-destructive h-9 w-9 p-0"
                        onClick={() => onDelete(c.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="Add category">
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Category name</label>
            <input
              required
              className="form-input"
              placeholder="e.g., Bonnet, Headlights"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            endpoint="/categories/upload"
            label="Image (optional)"
          />
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="font-medium text-foreground">Show by brand</p>
              <p className="text-xs text-muted-foreground">When enabled, products are organized by brand. Disable for general categories.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowByBrand(!showByBrand)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                showByBrand ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  showByBrand ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <button className="btn-primary h-11 w-full" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="btn-spinner mr-2 h-4 w-4" />
                Creating...
              </span>
            ) : "Create"}
          </button>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditing(null); resetForm(); }} title="Edit category">
        <form onSubmit={onUpdate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Category name</label>
            <input
              required
              className="form-input"
              placeholder="e.g., Bonnet, Headlights"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            endpoint="/categories/upload"
            label="Image (optional)"
          />
          <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
            <div>
              <p className="font-medium text-foreground">Show by brand</p>
              <p className="text-xs text-muted-foreground">When enabled, products are organized by brand. Disable for general categories.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowByBrand(!showByBrand)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                showByBrand ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  showByBrand ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <button className="btn-primary h-11 w-full" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="btn-spinner mr-2 h-4 w-4" />
                Saving...
              </span>
            ) : "Save changes"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
