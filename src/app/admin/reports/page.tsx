"use client";

import React from "react";
import { Calendar, Download } from "lucide-react";
import { apiGet, apiPost, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StickyActionBar } from "@/components/ui/StickyActionBar";

type RangeResult = { revenue: number; itemsSold: number };
type ProductBreakdown = { product_id: string; name: string; total: number; quantity: number };
type CustomerInsight = {
  user_id: string | null;
  name: string;
  email: string;
  order_count: number;
  total_spent: number;
};
type InsightsResponse = { customers: CustomerInsight[]; avgOrderValue: number };

export default function AdminReportsPage() {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [result, setResult] = React.useState<RangeResult | null>(null);
  const [productBreakdown, setProductBreakdown] = React.useState<ProductBreakdown[]>([]);
  const [insights, setInsights] = React.useState<InsightsResponse | null>(null);
  const { push } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const [res, productRes, insightsRes] = await Promise.all([
        apiPost<RangeResult>("/reports/range", {
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString(),
        }),
        apiGet<ProductBreakdown[]>("/reports/sales/products"),
        apiGet<InsightsResponse>("/reports/customers/insights"),
      ]);
      setResult(res);
      setProductBreakdown(productRes || []);
      setInsights(insightsRes || null);
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Reports"
        subtitle="Generate custom revenue and volume analytics by date range."
      />

      <form onSubmit={onSubmit} className="card p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <input
              type="date"
              required
              className="w-full bg-transparent outline-none"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <input
              type="date"
              required
              className="w-full bg-transparent outline-none"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        <StickyActionBar className="mt-4">
          <button className="btn-primary h-10 text-sm">Run report</button>
        </StickyActionBar>
      </form>

      {!result ? (
        <EmptyState
          title="Run a report"
          description="Pick a date range to generate revenue and item totals."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                GHS {result.revenue.toLocaleString()}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-muted-foreground">Items sold</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {result.itemsSold}
              </p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-muted-foreground">Export report</p>
              <button className="btn-outline mt-3 h-9 text-xs">
                <Download className="mr-2 h-4 w-4" />
                Download CSV
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Top products</h3>
                <span className="text-xs text-muted-foreground">
                  {productBreakdown.length} items
                </span>
              </div>
              {productBreakdown.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No sales data yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="table text-sm">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productBreakdown.slice(0, 8).map((item) => (
                        <tr key={item.product_id}>
                          <td>{item.name}</td>
                          <td className="text-right">{item.quantity}</td>
                          <td className="text-right font-semibold">
                            GHS {item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Customer insights</h3>
                <span className="text-xs text-muted-foreground">
                  Avg order: GHS {insights?.avgOrderValue?.toLocaleString() || 0}
                </span>
              </div>
              {!insights || insights.customers.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No customer data yet.</p>
              ) : (
                <div className="mt-4 space-y-3 text-sm">
                  {insights.customers.slice(0, 6).map((c) => (
                    <div key={`${c.user_id}-${c.email}`} className="rounded-xl border border-border p-3">
                      <div className="font-semibold">{c.name || "Customer"}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Orders: {c.order_count} · Total: GHS {c.total_spent.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
