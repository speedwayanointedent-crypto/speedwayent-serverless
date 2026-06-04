"use client";

import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Package,
  TrendingUp,
  Users,
  ShoppingCart,
  AlertTriangle,
  RefreshCw,
  Download,
  CheckCircle,
  Clock,
  Truck,
} from "lucide-react";
import { apiGet, getApiErrorMessage } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";

type Summary = {
  revenue: number;
  itemsSold: number;
};

type SummaryResponse = {
  today: Summary;
  week: Summary;
  month: Summary;
  year: Summary;
};

type Product = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string | null;
};

type Order = {
  id: number;
  total: number;
  status: string;
  created_at: string;
  customer_name?: string;
};

type Sale = {
  id: number;
  total: number;
  quantity: number;
  created_at: string;
  products?: { name: string };
};

const buildRevenueSeries = (orders: Order[], sales: Sale[]) => {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleString("default", { month: "short" });
    months.push({ key, label });
  }

  const bucket: Record<string, number> = {};
  months.forEach((m) => {
    bucket[m.key] = 0;
  });

  orders
    .filter((o) => o.status === "completed")
    .forEach((o) => {
      const date = new Date(o.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (bucket[key] !== undefined) {
        bucket[key] += Number(o.total || 0);
      }
    });

  sales.forEach((s) => {
    const date = new Date(s.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (bucket[key] !== undefined) {
      bucket[key] += Number(s.total || 0);
    }
  });

  return months.map((m) => ({ name: m.label, revenue: bucket[m.key] }));
};

const getStockStatus = (quantity: number) => {
  if (quantity === 0) return { label: "Out of Stock", variant: "destructive" as const };
  if (quantity <= 5) return { label: "Low Stock", variant: "warning" as const };
  return { label: "In Stock", variant: "success" as const };
};

function Receipt({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 17.5v-11" />
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lowStock, setLowStock] = React.useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [revenueData, setRevenueData] = React.useState<{ name: string; revenue: number }[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [dateRange, setDateRange] = React.useState<"7d" | "30d" | "90d" | "1y">("30d");
  const { push } = useToast();

  const load = React.useCallback(async () => {
    try {
      const [summaryRes, lowStockRes, ordersRes, salesRes] = await Promise.all([
        apiGet<SummaryResponse>("/reports/summary"),
        apiGet<Product[]>("/products/low-stock?limit=20"),
        apiGet<Order[]>("/orders"),
        apiGet<Sale[]>("/sales"),
      ]);

      setSummary(summaryRes);
      const orders = Array.isArray(ordersRes) ? ordersRes : [];
      const sales = Array.isArray(salesRes) ? salesRes : [];

      const low = Array.isArray(lowStockRes) ? lowStockRes.slice(0, 6) : [];
      setLowStock(low);

      const recentOrdersList = [...orders]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      setRecentOrders(recentOrdersList);

      setRevenueData(buildRevenueSeries(orders, sales));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
      push(getApiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  React.useEffect(() => {
    load();
    const interval = window.setInterval(load, 30000);
    return () => window.clearInterval(interval);
  }, [load]);

  const formatCurrency = (value: number) => `GHS ${value.toLocaleString()}`;

  const getOrderStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "success" | "warning" | "destructive" | "muted"; label: string }> = {
      pending: { variant: "warning", label: "Pending" },
      processing: { variant: "warning", label: "Processing" },
      completed: { variant: "success", label: "Completed" },
      delivered: { variant: "success", label: "Delivered" },
      cancelled: { variant: "destructive", label: "Cancelled" },
    };
    return statusMap[status] || { variant: "muted", label: status };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Today's Revenue",
      value: summary ? formatCurrency(summary.today.revenue) : "GHS 0",
      subtitle: `${summary?.today.itemsSold || 0} items sold`,
      icon: <DollarSign className="h-5 w-5" />,
      variant: "primary" as const,
      trend: { value: 12, label: "vs yesterday" },
    },
    {
      title: "Weekly Revenue",
      value: summary ? formatCurrency(summary.week.revenue) : "GHS 0",
      subtitle: `${summary?.week.itemsSold || 0} items sold`,
      icon: <TrendingUp className="h-5 w-5" />,
      variant: "success" as const,
      trend: { value: 8, label: "vs last week" },
    },
    {
      title: "Monthly Revenue",
      value: summary ? formatCurrency(summary.month.revenue) : "GHS 0",
      subtitle: `${summary?.month.itemsSold || 0} items sold`,
      icon: <Package className="h-5 w-5" />,
      variant: "warning" as const,
      trend: { value: -3, label: "vs last month" },
    },
    {
      title: "Total Orders",
      value: recentOrders.length,
      subtitle: "This month",
      icon: <Users className="h-5 w-5" />,
      variant: "default" as const,
      trend: { value: 5, label: "vs last month" },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your store today."
        meta={lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="input h-10 w-36"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="primary" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <div
            key={card.title}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <StatCard {...card} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="none">
          <CardHeader className="px-5 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Track your revenue performance over time</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `GHS ${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.75rem",
                      boxShadow: "0 4px 12px -3px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    labelStyle={{ fontWeight: 600, color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <CardTitle>Low Stock Alerts</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Products that need restocking</p>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="space-y-3">
              {lowStock.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <CheckCircle className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">All products are well stocked!</p>
                </div>
              ) : (
                lowStock.map((item) => {
                  const status = getStockStatus(item.quantity);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 p-3 transition-all hover:border-border hover:shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[150px]">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <Badge variant={status.variant} size="sm">
                        {status.label}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Latest customer orders</p>
              </div>
              <a href="/admin/orders" className="btn-ghost text-sm">
                View all
              </a>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const statusBadge = getOrderStatusBadge(order.status);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl border border-border/60 p-3 transition-all hover:border-border hover:shadow-soft"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Receipt className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Order #{order.id.toString().padStart(4, "0")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(order.total)}</p>
                        <Badge variant={statusBadge.variant} size="sm" className="mt-1">
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card padding="none">
          <CardHeader className="px-5 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Quick Stats</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Key metrics at a glance</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Products</span>
                </div>
                <p className="text-2xl font-bold">{lowStock.length > 0 ? "Active" : "—"}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-gradient-to-br from-success/5 to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg bg-success/10 p-2">
                    <Truck className="h-4 w-4 text-success" />
                  </div>
                  <span className="text-xs text-muted-foreground">Deliveries</span>
                </div>
                <p className="text-2xl font-bold">{recentOrders.filter((o) => o.status === "delivered").length}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-gradient-to-br from-warning/5 to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg bg-warning/10 p-2">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-bold">{recentOrders.filter((o) => o.status === "pending").length}</p>
              </div>

              <div className="rounded-xl border border-border/60 bg-gradient-to-br from-destructive/5 to-transparent p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <span className="text-xs text-muted-foreground">Issues</span>
                </div>
                <p className="text-2xl font-bold">{lowStock.filter((p) => p.quantity === 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
