"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, Percent, Loader2, Keyboard, Sparkles } from "lucide-react";
import classNames from "classnames";
import type { CartItem } from "@/types/sale";
import { formatCurrency } from "@/types/sale";

interface SaleSummaryProps {
  items: CartItem[];
  discount?: number;
  onDiscountChange?: (discount: number) => void;
  onCompleteSale: () => void;
  onClearCart: () => void;
  loading?: boolean;
  note?: string;
  onNoteChange?: (note: string) => void;
  showNote?: boolean;
}

export const SaleSummary: React.FC<SaleSummaryProps> = ({
  items,
  discount = 0,
  onDiscountChange,
  onCompleteSale,
  onClearCart,
  loading = false,
  note = "",
  onNoteChange,
  showNote = true,
}) => {
  const [discountInput, setDiscountInput] = useState(String(discount || ""));
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [isPressed, setIsPressed] = useState(false);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total =
    discountType === "percent" ? subtotal - subtotal * (discount / 100) : subtotal - discount;
  const isValid = items.length > 0 && total > 0;

  const handleCompleteSale = useCallback(() => {
    if (isValid && !loading) {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 150);
      onCompleteSale();
    }
  }, [isValid, loading, onCompleteSale]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleCompleteSale();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleCompleteSale]);

  const handleDiscountChange = (value: string) => {
    setDiscountInput(value);
    const v = parseFloat(value) || 0;
    if (onDiscountChange) {
      onDiscountChange(discountType === "percent" ? Math.min(100, Math.max(0, v)) : Math.min(subtotal, Math.max(0, v)));
    }
  };

  const discountAmount = discountType === "percent" ? subtotal * (discount / 100) : discount;

  return (
    <div className="space-y-4">
      {showNote && (
        <textarea
          placeholder="Add a note for this sale (optional)"
          value={note}
          onChange={(e) => onNoteChange?.(e.target.value)}
          className="input min-h-[80px] w-full resize-none text-sm"
          rows={2}
        />
      )}

      {onDiscountChange && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Discount</span>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max={discountType === "percent" ? 100 : subtotal}
                step={discountType === "percent" ? 1 : 0.01}
                value={discountInput}
                onChange={(e) => handleDiscountChange(e.target.value)}
                placeholder={discountType === "percent" ? "0" : "0.00"}
                className="input h-10 w-full pr-10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {discountType === "percent" ? "%" : "GHS"}
              </span>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setDiscountType("amount");
                  setDiscountInput("");
                  onDiscountChange(0);
                }}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  discountType === "amount" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                GHS
              </button>
              <button
                type="button"
                onClick={() => {
                  setDiscountType("percent");
                  setDiscountInput("");
                  onDiscountChange(0);
                }}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  discountType === "percent" ? "bg-primary text-white" : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                %
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Items ({itemCount})</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-success">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" />
              Discount
            </span>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Total</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleCompleteSale}
          disabled={!isValid || loading}
          className={classNames(
            "relative w-full h-16 rounded-2xl font-bold text-lg transition-all duration-200 overflow-hidden",
            "focus:outline-none focus:ring-4 focus:ring-success/30",
            !isValid && !loading && "opacity-50 cursor-not-allowed",
            loading && "cursor-wait",
            isValid && !loading && !isPressed && "shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
            isPressed && "scale-[0.98]"
          )}
        >
          {loading ? (
            <div className="absolute inset-0 bg-gradient-to-r from-success via-emerald-500 to-success animate-pulse flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
              <span className="ml-3 text-white font-semibold">Processing Sale...</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-success via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:via-emerald-600 hover:to-emerald-700 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-bold tracking-wide">Complete Sale</span>
                <div className="ml-2 px-4 py-1.5 rounded-xl bg-white/20 backdrop-blur-sm">
                  <span className="text-white font-bold">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}
        </button>

        {isValid && !loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" />
            <span>
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl</kbd> +{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">Enter</kbd> to complete
            </span>
          </div>
        )}

        {items.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            disabled={loading}
            className="w-full py-3 text-sm text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            Clear Cart
          </button>
        )}
      </div>
    </div>
  );
};

interface QuickStatsProps {
  todayRevenue: number;
  todayItems: number;
  todayTransactions: number;
  avgTicket: number;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ todayRevenue, todayItems, todayTransactions, avgTicket }) => (
  <div className="grid grid-cols-2 gap-3">
    {[
      { label: "Today Revenue", value: formatCurrency(todayRevenue) },
      { label: "Items Sold", value: todayItems },
      { label: "Transactions", value: todayTransactions },
      { label: "Avg. Ticket", value: formatCurrency(avgTicket) },
    ].map((s) => (
      <div key={s.label} className="rounded-xl border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
        <p className="text-lg font-bold mt-1">{s.value}</p>
      </div>
    ))}
  </div>
);
