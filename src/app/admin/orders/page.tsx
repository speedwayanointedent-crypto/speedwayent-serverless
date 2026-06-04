"use client";

import React from "react";
import { Eye, Search, Package, RefreshCw } from "lucide-react";
import { apiGet, apiPatch, getApiErrorMessage } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  users?: { full_name: string; email: string };
};

type OrderReturn = {
  id: string;
  status: string;
  reason?: string | null;
  amount?: number | null;
  created_at: string;
  orders?: { id: string; total: number };
  users?: { full_name?: string; email?: string };
};

const statusConfig: Record<string, { variant: "default" | "success" | "warning" | "destructive"; label: string }> = {
  pending: { variant: "warning", label: "Pending" },
  processing: { variant: "warning", label: "Processing" },
  completed: { variant: "success", label: "Completed" },
  cancelled: { variant: "destructive", label: "Cancelled" },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [returns, setReturns] = React.useState<OrderReturn[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Order | null>(null);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ordersRes = await apiGet<any>("/orders");
      const ordersData = Array.isArray(ordersRes) ? ordersRes : [];
      setOrders(ordersData);

      try {
        const returnsRes = await apiGet<any>("/orders/returns");
        setReturns(Array.isArray(returnsRes) ? returnsRes : []);
      } catch {
        setReturns([]);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(getApiErrorMessage(err));
      push(getApiErrorMessage(err), "error");
      setOrders([]);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [push]);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiPatch(`/orders/${id}/status`, { status });
      push("Order status updated", "success");
      load();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const updateReturnStatus = async (id: string, status: string) => {
    try {
      await apiPatch(`/orders/returns/${id}`, { status });
      push("Return updated", "success");
      load();
    } catch (err) {
      push(getApiErrorMessage(err), "error");
    }
  };

  const filtered = React.useMemo(() => {
    if (!query.trim()) return orders;
    const q = query.toLowerCase();
    return orders.filter((o) =>
      String(o.id).includes(q) ||
      o.users?.full_name?.toLowerCase().includes(q) ||
      o.users?.email?.toLowerCase().includes(q)
    );
  }, [orders, query]);

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { variant: "default" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders and fulfillment status."
        meta={
          <span className="text-muted-foreground">
            {orders.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </span>
        }
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card className="border-destructive/50 bg-destructive/5 p-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={load} className="mt-2">
            Try Again
          </Button>
        </Card>
      )}

      <Card padding="md">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="input pl-11"
            placeholder="Search by order ID, customer name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No orders found"
            description={query ? "Try adjusting your search." : "Orders will appear here as customers checkout."}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-4 transition-all hover:border-border hover:shadow-soft"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">#{o.id.toString().padStart(4, "0")}</p>
                    <p className="text-sm text-muted-foreground">
                      {o.users?.full_name || "Guest"} · {o.users?.email || "No email"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold">GHS {Number(o.total || 0).toLocaleString()}</p>
                    {getStatusBadge(o.status)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelected(o);
                        setOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <select
                      className="input h-9 w-28 text-xs"
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md">
        <h2 className="text-lg font-semibold mb-4">Returns & Refunds</h2>
        {returns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No return requests.</p>
        ) : (
          <div className="space-y-2">
            {returns.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-4"
              >
                <div>
                  <p className="font-semibold">#{r.orders?.id?.toString().padStart(4, "0")}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.users?.full_name || "Guest"} · {r.reason || "No reason"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold">GHS {Number(r.amount || r.orders?.total || 0).toLocaleString()}</p>
                  <select
                    className="input h-9 w-28 text-xs"
                    value={r.status}
                    onChange={(e) => updateReturnStatus(r.id, e.target.value)}
                  >
                    <option value="requested">Requested</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Order Details">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</p>
              <p className="text-lg font-semibold">#{selected.id.toString().padStart(4, "0")}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer</p>
              <p className="font-semibold">{selected.users?.full_name || "Guest"}</p>
              <p className="text-sm text-muted-foreground">{selected.users?.email || "No email"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="text-xl font-bold">GHS {Number(selected.total || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              {getStatusBadge(selected.status)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
              <p className="text-sm">{new Date(selected.created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
