export type GalleryItem = {
  url: string;
  type: "image" | "video";
};

export type Product = {
  id: string;
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  status: "active" | "inactive";
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  year_id?: string | null;
  gallery?: GalleryItem[];
  cost_price?: number | null;
  categories?: { name?: string; id?: string };
  brands?: { name?: string; id?: string };
  models?: { name?: string; image_url?: string; gallery?: string[] };
  years?: { id?: string; label?: string };
  created_at?: string;
};

export type CartItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  availableStock?: number;
  image_url?: string | null;
  category?: string;
  brand?: string;
  model?: string;
  year?: string;
  isManual?: boolean;
  isNew?: boolean;
};

export type SaleRecord = {
  id: string;
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  price?: number | null;
  unit_price?: number | null;
  total: number;
  created_at?: string;
  note?: string | null;
};

export type SaleItem = {
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  price: number;
  note?: string;
};

export type CategoryOption = { id: string; name: string; image_url?: string | null; show_by_brand?: boolean };
export type BrandOption = { id: string; name: string; logo_url?: string | null; is_hidden?: boolean };
export type ModelOption = { id: string; name: string; brand_id: string; years?: string[]; image_url?: string | null; gallery?: string[] };
export type YearOption = { id: string; label: string | number };

export type SaleStats = {
  todayRevenue: number;
  todayItems: number;
  todayTransactions: number;
  avgTicket: number;
};

export type FilterOptions = {
  search: string;
  category: string;
  brand: string;
  model: string;
  year: string;
};

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const getUnitPrice = (s: { price?: number; unit_price?: number }): number =>
  Number(s.price ?? s.unit_price ?? 0);

export const getStockStatus = (qty: number): StockStatus => {
  if (qty <= 0) return "out_of_stock";
  if (qty <= 5) return "low_stock";
  return "in_stock";
};

export const formatCurrency = (v: number): string =>
  `GHS ${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export type OrderStatus = "pending" | "processing" | "shipped" | "completed" | "cancelled";
export type ReturnStatus = "requested" | "approved" | "rejected" | "refunded";
export type UserRole = "admin" | "manager" | "staff" | "customer";
