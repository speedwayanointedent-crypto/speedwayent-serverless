"use client";

import { useEffect, useState } from "react";
import { Trash2, Package, Edit2, Check, X } from "lucide-react";
import classNames from "classnames";
import { QuantitySelector, StockIndicator } from "./QuantitySelector";
import type { CartItem as CartItemType } from "@/types/sale";
import { formatCurrency } from "@/types/sale";

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (id: string, quantity: number) => void;
  onPriceChange: (id: string, price: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  onQuantityChange,
  onPriceChange,
  onRemove,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(String(item.unit_price));
  const [isHighlighted, setIsHighlighted] = useState(item.isNew || false);

  useEffect(() => {
    if (item.isNew) {
      setIsHighlighted(true);
      const t = setTimeout(() => setIsHighlighted(false), 1500);
      return () => clearTimeout(t);
    }
  }, [item.isNew]);

  const lineTotal = item.quantity * item.unit_price;
  const maxQty = item.isManual ? Infinity : (item.availableStock ?? 0);
  const isLowStock = !item.isManual && (item.availableStock ?? 0) > 0 && (item.availableStock ?? 0) <= 5;

  const submitPrice = () => {
    const v = parseFloat(editPrice);
    if (!isNaN(v) && v >= 0) onPriceChange(item.id, v);
    else setEditPrice(String(item.unit_price));
    setIsEditing(false);
  };
  const cancelPrice = () => {
    setEditPrice(String(item.unit_price));
    setIsEditing(false);
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") submitPrice();
    else if (e.key === "Escape") cancelPrice();
  };

  return (
    <div
      className={classNames(
        "group relative rounded-xl border border-border bg-card p-4 transition-all duration-300",
        isHighlighted && "animate-pulse bg-primary/5 border-primary/30",
        "hover:border-primary/20 hover:shadow-sm"
      )}
    >
      <div className="flex gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-lg bg-muted/50 flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.product_name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Package className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-sm leading-tight line-clamp-2">{item.product_name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {item.isManual ? (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">Manual</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {[item.category, item.brand].filter(Boolean).join(" • ")}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              className="flex-shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <QuantitySelector
              value={item.quantity}
              onChange={(qty) => onQuantityChange(item.id, qty)}
              min={1}
              max={maxQty}
              disabled={disabled}
              size="sm"
              showWarning={!item.isManual}
              warningThreshold={5}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">@</span>
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    onKeyDown={onKey}
                    className="input h-8 w-20 text-sm focus:ring-2 focus:ring-primary/20"
                    autoFocus
                    step="0.01"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={submitPrice}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-success text-white hover:bg-success/90"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelPrice}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditPrice(String(item.unit_price));
                    setIsEditing(true);
                  }}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {formatCurrency(item.unit_price)}
                  <Edit2 className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
          {!item.isManual && (
            <div className="flex items-center gap-2">
              <StockIndicator quantity={item.availableStock ?? 0} />
              {isLowStock && <span className="text-xs text-warning">Only {item.availableStock} left</span>}
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Line total</span>
            <span className="font-semibold text-sm">{formatCurrency(lineTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CartItemListProps {
  items: CartItemType[];
  onQuantityChange: (id: string, quantity: number) => void;
  onPriceChange: (id: string, price: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
  maxHeight?: string;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  onQuantityChange,
  onPriceChange,
  onRemove,
  disabled = false,
  maxHeight = "max-h-[400px]",
}) => {
  if (items.length === 0) return null;
  return (
    <div className={classNames("space-y-3 overflow-y-auto", maxHeight)}>
      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onQuantityChange={onQuantityChange}
          onPriceChange={onPriceChange}
          onRemove={onRemove}
          disabled={disabled}
        />
      ))}
    </div>
  );
};
