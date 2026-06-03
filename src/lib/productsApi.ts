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
  try {
    const { signal, ...rest } = params;
    const res: any = await apiGet("/api/products/all", { params: rest, signal });
    if (Array.isArray(res)) return res.map(normalize);
  } catch {
    // fall back to paginated
  }

  const all: Normalized[] = [];
  const limit = 100;
  let page = 1;
  for (let i = 0; i < 200; i++) {
    const { signal, ...rest } = params;
    const res: any = await apiGet("/api/products", { params: { ...rest, page, limit }, signal });
    const data: any[] = Array.isArray(res) ? res : res?.data || [];
    if (!data.length) break;
    all.push(...data.map(normalize));
    const totalPages = res?.pagination?.totalPages || 1;
    if (page >= totalPages) break;
    page++;
  }
  return all;
}

export async function searchProducts(q: string, params: Record<string, any> = {}): Promise<Normalized[]> {
  const res: any = await apiGet("/api/products", { params: { q, page: 1, limit: 200, ...params } });
  const data: any[] = Array.isArray(res) ? res : res?.data || [];
  return data.map(normalize);
}
