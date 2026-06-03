"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  History,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  Calendar,
  AlertTriangle,
  Keyboard,
  Sparkles,
  Loader2,
  CreditCard,
  Banknote,
  Receipt,
} from "lucide-react";
import classNames from "classnames";
import { apiGet, getApiErrorMessage } from "@/lib/api";
import { salesApi, formatSaleForCompletion } from "@/lib/salesApi";
import { fetchAllProducts } from "@/lib/productsApi";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { useSearch } from "@/lib/useSearch";
import {
  ProductSearch,
  ManualProductForm,
  CartItemList,
  QuickStats,
} from "@/components/pos";
import type { Product, CartItem, SaleRecord, SaleStats } from "@/types/sale";
import { formatCurrency } from "@/types/sale";

type TabMode = "inventory" | "manual";

type SaleRecordAPI = {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  created_at?: string;
  note?: string | null;
};

export default function AdminSalesPage() {
  const [activeTab, setActiveTab] = useState<TabMode>("inventory");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [allProducts, setAllProducts] = useState<Map<string, Product>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<"pos" | "history">("pos");
  const { push } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, productsData] = await Promise.all([
        apiGet<SaleRecordAPI[]>("/sales"),
        fetchAllProducts(),
      ]);

      const salesData = Array.isArray(salesRes) ? salesRes : [];
      const mappedSales: SaleRecord[] = salesData.map((sale) => ({
        id: String(sale.id),
        product_id: sale.product_id || null,
        product_name: sale.product_name || "Unknown Product",
        quantity: Number(sale.quantity || 0),
        price: Number(sale.price || 0),
        total: Number(sale.total || 0),
        created_at: sale.created_at,
        note: sale.note || null,
      }));
      setSales(mappedSales);

      setAllProducts(new Map(productsData.map((p) => [p.id, p])));
    } catch (err) {
      console.error("Failed to load data:", err);
      push(getApiErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats: SaleStats = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter((s) => s.created_at?.slice(0, 10) === todayKey);
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
    const todayItems = todaySales.reduce((sum, s) => sum + s.quantity, 0);
    const todayTransactions = todaySales.length;
    const avgTicket = todayTransactions ? todayRevenue / todayTransactions : 0;

    return { todayRevenue, todayItems, todayTransactions, avgTicket };
  }, [sales]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const addProductToCart = useCallback((product: Product) => {
    if (product.quantity <= 0) {
      push(`${product.name} is out of stock`, "error");
      return;
    }

    setCartItems((current) => {
      const existing = current.find(
        (item) => item.product_id === product.id && !item.isManual
      );
      if (existing) {
        if (existing.quantity >= product.quantity) {
          push(`Only ${product.quantity} available for ${product.name}`, "error");
          return current;
        }
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, availableStock: product.quantity }
            : item
        );
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: Number(product.price || 0),
          availableStock: product.quantity,
          image_url: product.models?.image_url || product.image_url || null,
          category: product.categories?.name,
          brand: product.brands?.name,
          model: product.models?.name,
          year: product.years?.label,
          isManual: false,
          isNew: true,
        },
      ];
    });

    push(`${product.name} added to cart`, "success");
  }, [push]);

  const addManualItemToCart = useCallback((item: { name: string; price: number; quantity: number }) => {
    setCartItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        product_id: null,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        availableStock: Number.MAX_SAFE_INTEGER,
        isManual: true,
        isNew: true,
      },
    ]);
    push(`${item.name} added to cart`, "success");
  }, [push]);

  const updateCartQuantity = useCallback((itemId: string, nextQuantity: number) => {
    setCartItems((current) => {
      if (nextQuantity <= 0) {
        return current.filter((item) => item.id !== itemId);
      }

      return current.map((item) => {
        if (item.id !== itemId) return item;
        if (item.isManual || !item.product_id) {
          return { ...item, quantity: nextQuantity };
        }
        const available = allProducts.get(item.product_id)?.quantity ?? item.availableStock ?? 0;
        if (nextQuantity > available) {
          push(`Only ${available} available for ${item.product_name}`, "error");
          return { ...item, availableStock: available };
        }
        return { ...item, quantity: nextQuantity, availableStock: available };
      });
    });
  }, [allProducts, push]);

  const updateCartPrice = useCallback((itemId: string, nextPrice: number) => {
    setCartItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, unit_price: nextPrice } : item
      )
    );
  }, []);

  const removeCartItem = useCallback((itemId: string) => {
    const item = cartItems.find((i) => i.id === itemId);
    setCartItems((current) => current.filter((i) => i.id !== itemId));
    if (item) {
      push(`${item.product_name} removed`, "info");
    }
  }, [cartItems, push]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setNote("");
    setDiscount(0);
    push("Cart cleared", "info");
  }, [push]);

  const completeSale = useCallback(async () => {
    if (cartItems.length === 0) {
      push("Add at least one product before checkout", "error");
      return;
    }
    if (saving) return;

    for (const item of cartItems) {
      if (item.unit_price <= 0) {
        push(`Enter a valid price for ${item.product_name}`, "error");
        return;
      }
      if (!item.isManual && item.product_id) {
        const available = allProducts.get(item.product_id)?.quantity ?? 0;
        if (item.quantity > available) {
          push(`Only ${available} available for ${item.product_name}`, "error");
          return;
        }
      }
    }

    setSaving(true);
    try {
      const saleItems = cartItems.map((item) => formatSaleForCompletion({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        note,
      }));

      await salesApi.createBatchSales(saleItems);

      const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) - discount;
      push(
        `Sale completed! ${cartCount} item(s) for ${formatCurrency(totalAmount)}`,
        "success"
      );
      clearCart();
      await loadData();
    } catch (error: any) {
      push(getApiErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  }, [cartItems, allProducts, cartCount, discount, note, clearCart, loadData, push, saving]);

  const salesSearchFields = useMemo(() => [
    "product_name",
    "id",
  ] as (keyof SaleRecord | string)[], []);

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    items: searchedSales,
  } = useSearch<SaleRecord>(sales, {
    fields: salesSearchFields,
    debounceMs: 200,
    keepResultsOnEmpty: true,
  });

  const filteredByDate = useMemo(() => {
    if (!selectedDate) return searchedSales;
    return searchedSales.filter((s) => s.created_at?.slice(0, 10) === selectedDate);
  }, [searchedSales, selectedDate]);

  const groupedSales = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number; items: number }>();
    filteredByDate.forEach((sale) => {
      if (!sale.created_at) return;
      const key = sale.created_at.slice(0, 10);
      const current = grouped.get(key) || { total: 0, count: 0, items: 0 };
      grouped.set(key, {
        total: current.total + sale.total,
        count: current.count + 1,
        items: current.items + sale.quantity,
      });
    });
    return Array.from(grouped.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredByDate]);

  const getFriendlyDate = (value?: string) => {
    if (!value) return "";
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <PageLoading text="Loading sales..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className="text-muted-foreground mt-1">
            Fast, intuitive sales processing for your store
            {allProducts.size > 0 && (
              <span className="ml-2 text-xs">({allProducts.size} products loaded)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "pos" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("pos")}
            icon={<ShoppingCart className="h-4 w-4" />}
          >
            POS
          </Button>
          <Button
            variant={viewMode === "history" ? "primary" : "outline"}
            size="sm"
            onClick={() => setViewMode("history")}
            icon={<History className="h-4 w-4" />}
          >
            History
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {viewMode === "pos" ? (
        <>
          <QuickStats {...stats} />

          <div className="grid gap-6 lg:grid-cols-[1fr,420px]">
            <Card padding="md" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setActiveTab("inventory")}
                      className={classNames(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        activeTab === "inventory"
                          ? "bg-primary text-white"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Package className="h-4 w-4 inline-block mr-2" />
                      From Inventory
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("manual")}
                      className={classNames(
                        "px-4 py-2 text-sm font-medium transition-colors",
                        activeTab === "manual"
                          ? "bg-primary text-white"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Plus className="h-4 w-4 inline-block mr-2" />
                      Manual Entry
                    </button>
                  </div>
                </div>

                {cartCount > 0 && (
                  <Badge variant="primary" className="px-3 py-1">
                    {cartCount} item(s) in cart
                  </Badge>
                )}
              </div>

              {activeTab === "inventory" ? (
                <ProductSearch
                  onProductSelect={addProductToCart}
                  maxResults={20}
                />
              ) : (
                <ManualProductForm onAdd={addManualItemToCart} />
              )}
            </Card>

            <div className="space-y-4">
              <Card padding="md" className="xl:sticky xl:top-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Current Sale</h2>
                    {cartCount > 0 && (
                      <Badge variant="primary" size="sm">{cartCount}</Badge>
                    )}
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Clear
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-12">
                    <EmptyState
                      title="Cart is empty"
                      description="Search products or use manual entry to start a sale."
                    />
                  </div>
                ) : (
                  <>
                    <CartItemList
                      items={cartItems}
                      onQuantityChange={updateCartQuantity}
                      onPriceChange={updateCartPrice}
                      onRemove={removeCartItem}
                      maxHeight="max-h-[280px]"
                    />
                  </>
                )}
              </Card>

              {cartItems.length > 0 && (
                <Card padding="md" className="border-2 border-success/20 bg-gradient-to-b from-success/5 to-transparent">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-5 w-5 text-success" />
                      <h3 className="font-semibold">Checkout</h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal ({cartCount} items)</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>

                      {discount > 0 && (
                        <div className="flex items-center justify-between text-sm text-success">
                          <span>Discount</span>
                          <span className="font-medium">-{formatCurrency(discount)}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-2xl font-bold text-success">
                          {formatCurrency(subtotal - discount)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={completeSale}
                        disabled={saving}
                        className={classNames(
                          "relative w-full h-16 rounded-2xl font-bold text-lg transition-all duration-200 overflow-hidden",
                          "focus:outline-none focus:ring-4 focus:ring-success/30",
                          saving && "cursor-wait",
                          !saving && "hover:scale-[1.01] active:scale-[0.99]"
                        )}
                      >
                        {saving ? (
                          <div className="absolute inset-0 bg-gradient-to-r from-success via-emerald-500 to-success animate-pulse flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                            <span className="ml-3 text-white font-semibold">Processing...</span>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-r from-success via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-success hover:to-success">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                            <div className="h-full flex items-center justify-center gap-3">
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                                <Sparkles className="h-5 w-5 text-white" />
                              </div>
                              <span className="text-white font-bold tracking-wide">Complete Sale</span>
                            </div>
                          </div>
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Keyboard className="h-3 w-3" />
                        <span>Press</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] border border-border/50">Ctrl</kbd>
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] border border-border/50">Enter</kbd>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                          <CreditCard className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payment</p>
                          <p className="text-sm font-medium">Cash / Card</p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10">
                          <Banknote className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Change</p>
                          <p className="text-sm font-medium">Auto-calc</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {cartItems.length > 0 && (
                <div className="rounded-xl border border-dashed border-warning/50 bg-warning/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-warning">Pending checkout</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Complete this sale to update inventory and record the transaction.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
          <Card padding="md">
            <div className="mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Sales by Day
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Click a date to view sales
              </p>
            </div>

            {groupedSales.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No sales recorded yet
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {groupedSales.map((day) => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={classNames(
                      "w-full rounded-xl border p-3 text-left transition-all",
                      selectedDate === day.date
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{day.date}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {day.count} sales • {day.items} items
                        </p>
                      </div>
                      <p className="font-semibold text-sm">{formatCurrency(day.total)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  Sales for {selectedDate}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredByDate.length} transactions
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search sales..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 h-10 w-48 text-sm"
                />
              </div>
            </div>

            {filteredByDate.length === 0 ? (
              <EmptyState
                title="No sales found"
                description={searchQuery ? "Try a different search term" : "No sales recorded for this date"}
              />
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredByDate.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{sale.product_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {getFriendlyDate(sale.created_at)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Qty: {sale.quantity} × {formatCurrency(sale.price ?? 0)}
                        </span>
                      </div>
                      {sale.note && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          Note: {sale.note}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold ml-4 flex-shrink-0">
                      {formatCurrency(sale.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
