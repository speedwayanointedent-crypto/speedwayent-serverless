import { apiGet } from "./api";
import type { Product } from "@/types/sale";

type Normalized = Product & {
  categories?: { name?: string };
  brands?: { name?: string };
  models?: { name?: string; image_url?: string; gallery?: string[] };
  years?: { id?: string; label?: string };
};

function normalize(p: any): Normalized {
  return {
    id: p.id || p._id?.toString?.() || String(p._id),
    name: p.name,
    price: Number(p.price ?? 0),
    quantity: Number(p.quantity ?? 0),
    image_url: p.image_url ?? null,
    status: p.status || "active",
    description: p.description ?? null,
    category_id: p.category_id?.toString?.() || p.category_id || null,
    brand_id: p.brand_id?.toString?.() || p.brand_id || null,
    model_id: p.model_id?.toString?.() || p.model_id || null,
    year_id: p.year_id?.toString?.() || p.year_id || null,
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    cost_price: p.cost_price ?? null,
    created_at: p.created_at,
    categories: p.categories ? { name: p.categories.name } : undefined,
    brands: p.brands ? { name: p.brands.name } : undefined,
    models: p.models ? { name: p.models.name, image_url: p.models.image_url, gallery: p.models.gallery } : undefined,
    years: p.years ? { id: p.years.id, label: p.years.label } : undefined,
  };
}

type FetchAllParams = {
  q?: string;
  status?: string;
  category_id?: string;
  brand_id?: string;
  signal?: AbortSignal;
};

export async function fetchAllProducts(params: FetchAllParams = {}): Promise<Normalized[]> {
  // Skip /api/products/all (it returns a single huge response that times out or
  // hits the 4.5MB Vercel body limit on large catalogs). Paginate the regular
  // /api/products endpoint in parallel instead. Each page response stays small
  // (limit=200 with joined data is well under 1MB), so 6k products come back
  // in ~1-2s instead of 30s sequential.
  const { signal, ...rest } = params;
  const queryParams: Record<string, string | number | boolean | null | undefined> = rest;
  const PAGE_SIZE = 200;
  const MAX_PAGES = 100; // safety cap = 20,000 products
  const PARALLELISM = 10;

  const first = await apiGet("/api/products", {
    params: { ...queryParams, page: 1, limit: PAGE_SIZE },
    ...(signal ? { signal } : {}),
  } as any).catch(() => null);
  if (!first) return [];

  const firstData: any[] = Array.isArray(first) ? first : first?.data || [];
  const totalPages: number = (first as any)?.pagination?.totalPages || 1;
  if (totalPages <= 1) return firstData.map(normalize);

  const pagesToFetch: number[] = [];
  for (let p = 2; p <= Math.min(totalPages, MAX_PAGES); p++) pagesToFetch.push(p);

  const all: Normalized[] = [...firstData.map(normalize)];
  for (let i = 0; i < pagesToFetch.length; i += PARALLELISM) {
    const batch = pagesToFetch.slice(i, i + PARALLELISM);
    const results = await Promise.all(
      batch.map((page) =>
        apiGet("/api/products", {
          params: { ...queryParams, page, limit: PAGE_SIZE },
          ...(signal ? { signal } : {}),
        } as any)
          .then((r: any) => (Array.isArray(r) ? r : r?.data || []))
          .catch(() => [])
      )
    );
    for (const data of results) {
      for (const p of data) all.push(normalize(p));
    }
  }
  return all;
}

export async function searchProducts(q: string, params: Record<string, any> = {}): Promise<Normalized[]> {
  const res: any = await apiGet("/api/products", { params: { q, page: 1, limit: 200, ...params } });
  const data: any[] = Array.isArray(res) ? res : res?.data || [];
  return data.map(normalize);
}
