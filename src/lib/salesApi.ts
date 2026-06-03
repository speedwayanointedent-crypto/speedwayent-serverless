import { apiGet, apiPost } from "./api";
import type { CartItem, SaleItem, SaleRecord } from "@/types/sale";

type CreateSalePayload = {
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  price: number;
  note?: string;
};

export const salesApi = {
  async createSale(payload: CreateSalePayload) {
    return apiPost<SaleRecord>("/api/sales", payload);
  },
  async createBatchSales(items: CreateSalePayload[], note?: string) {
    return apiPost<{ sales: SaleRecord[]; summary: { items_count: number; total: number } }>(
      "/api/sales/batch",
      { items, note }
    );
  },
  async getSales(params: { page?: number; limit?: number; date?: string; start_date?: string; end_date?: string } = {}) {
    return apiGet<{ sales: SaleRecord[]; pagination?: any } | SaleRecord[]>("/api/sales", { params });
  },
  async getTodaySales() {
    const today = new Date().toISOString().slice(0, 10);
    return this.getSales({ date: today });
  },
  async getSalesByDateRange(start: string, end: string) {
    return this.getSales({ start_date: start, end_date: end });
  },
};

export function formatSaleForCompletion(item: { product_id: string | null; product_name: string; quantity: number; unit_price: number; note?: string }): SaleItem {
  return {
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    price: item.unit_price,
    note: item.note,
  };
}
