"use client";

import React from "react";
import { Plus, Search, Layers, Pencil, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete, getApiErrorMessage } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { ImageUploader } from "@/components/ui/ImageUploader";

type Brand = { id: string; name: string; logo_url?: string | null };

export default function AdminBrandsPage() {
  const [items, setItems] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Brand | null>(null);
  const [name, setName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<Brand[]>("/brands");
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
    setLogoUrl("");
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiPost("/brands", { name, logo_url: logoUrl || null });
      push("Brand created", "success");
      resetForm();
      setOpen(false);
      load();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onOpenEdit = (brand: Brand) => {
    setEditing(brand);
    setName(brand.name);
    setLogoUrl(brand.logo_url || "");
    setEditOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || submitting) return;
    setSubmitting(true);
    try {
      await apiPut(`/brands/${editing.id}`, { name, logo_url: logoUrl || null });
      push("Brand updated", "success");
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
    const confirmed = window.confirm("Are you sure you want to delete this brand? This may affect products using this brand.");
    if (!confirmed) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiDelete(`/brands/${id}`);
      push("Brand deleted", "success");
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
        title="Brands"
        subtitle="Maintain supplier and manufacturer brand lists."
        meta={
          <>
            {items.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
        actions={
          <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add brand
          </button>
        }
      />

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="input pl-11"
            placeholder="Search brands..."
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
          <PageLoading text="Loading brands..." />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No brands found"
              description="Try adjusting your search or add a new brand."
              action={
                <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
                  Add brand
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="card card-hover overflow-hidden p-0">
                <div className="relative h-32 w-full bg-muted/30">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="h-full w-full object-contain p-4" />
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
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">OEM partner</p>
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

      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="Add brand">
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Brand name</label>
            <input
              required
              className="form-input"
              placeholder="e.g., Toyota, Honda, BMW"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <ImageUploader
            value={logoUrl}
            onChange={setLogoUrl}
            endpoint="/brands/upload"
            label="Logo (optional)"
            previewSize="sm"
          />
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

      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditing(null); resetForm(); }} title="Edit brand">
        <form onSubmit={onUpdate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Brand name</label>
            <input
              required
              className="form-input"
              placeholder="e.g., Toyota, Honda, BMW"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <ImageUploader
            value={logoUrl}
            onChange={setLogoUrl}
            endpoint="/brands/upload"
            label="Logo (optional)"
            previewSize="sm"
          />
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
