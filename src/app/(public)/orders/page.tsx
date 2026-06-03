"use client";

import React from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { Package, Truck, CheckCircle, Clock, XCircle, ShoppingBag } from "lucide-react";

type Order = {
  id: number; total: number; status: string; created_at: string;
  estimated_delivery_date?: string | null;
  order_status_events?: { id: number; status: string; note?: string | null; created_at: string }[];
};

const statusConfig: Record<string, { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Clock },
  processing: { color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30", icon: Package },
  shipped: { color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", icon: Truck },
  completed: { color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle },
  cancelled: { color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", icon: XCircle }
};

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const data = await apiGet<Order[] | { data: Order[] }>("/api/orders/my");
        const ordersData = Array.isArray(data) ? data : (data?.data || []);
        setOrders(ordersData);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getStatusConfig = (status: string) => {
    return statusConfig[status.toLowerCase()] || statusConfig.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto max-w-4xl px-4 pb-12 pt-6 sm:pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Orders</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Track your recent purchases and delivery status</p>
          </div>
          <Link href="/shop" className="px-6 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
              <ShoppingBag className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">When you place an order, it will show up here with tracking details.</p>
            <Link href="/shop" className="px-8 py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = getStatusConfig(order.status);
              const StatusIcon = status.icon;
              return (
                <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden transition-all">
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${status.bg} flex items-center justify-center`}>
                          <StatusIcon className={`w-6 h-6 ${status.color}`} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Order #{order.id.toString().padStart(4, "0")}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${status.bg} ${status.color}`}>
                          {order.status}
                        </span>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">GHS {order.total.toLocaleString()}</p>
                      </div>
                    </div>

                    {order.estimated_delivery_date && (
                      <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 flex items-center gap-3">
                        <Truck className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-blue-700 dark:text-blue-300">Estimated delivery: {new Date(order.estimated_delivery_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {order.order_status_events && order.order_status_events.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {order.order_status_events.slice().reverse().map((event) => (
                          <div key={event.id} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary"></div>
                            <span className="text-gray-600 dark:text-gray-400">{new Date(event.created_at).toLocaleDateString()}</span>
                            <span className="font-medium text-gray-900 dark:text-white capitalize">{event.status}</span>
                            {event.note && <span className="text-gray-500">- {event.note}</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link href={`/invoice/${order.id}`} className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        View Invoice
                      </Link>
                      {order.status !== "cancelled" && order.status !== "completed" && (
                        <button className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity">
                          Track Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
