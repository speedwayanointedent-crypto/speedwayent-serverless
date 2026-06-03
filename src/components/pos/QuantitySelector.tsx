"use client";

import { Minus, Plus } from "lucide-react";
import classNames from "classnames";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showWarning?: boolean;
  warningThreshold?: number;
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = Infinity,
  disabled = false,
  size = "md",
  showWarning = false,
  warningThreshold = 5,
}) => {
  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);
  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v) && v >= min && v <= max) onChange(v);
  };

  const sizes = {
    sm: { btn: "w-7 h-7", input: "w-10 text-xs", icon: "h-3 w-3" },
    md: { btn: "w-8 h-8", input: "w-12 text-sm", icon: "h-4 w-4" },
    lg: { btn: "w-10 h-10", input: "w-14 text-base", icon: "h-5 w-5" },
  };
  const s = sizes[size];
  const low = showWarning && value <= warningThreshold && value > 0;
  const maxReached = value >= max;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        className={classNames(
          "flex items-center justify-center rounded-lg border border-border bg-background transition-all duration-200",
          s.btn,
          "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        )}
      >
        <Minus className={s.icon} />
      </button>
      <input
        type="number"
        value={value}
        onChange={onInput}
        disabled={disabled}
        min={min}
        max={max}
        className={classNames(
          "flex items-center justify-center rounded-lg border border-border bg-background text-center font-semibold transition-all duration-200",
          s.input,
          "focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40",
          "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          low && "border-warning text-warning",
          maxReached && !low && "border-destructive text-destructive"
        )}
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        className={classNames(
          "flex items-center justify-center rounded-lg border border-border bg-background transition-all duration-200",
          s.btn,
          "hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        )}
      >
        <Plus className={s.icon} />
      </button>
    </div>
  );
};

interface StockIndicatorProps {
  quantity: number;
  lowThreshold?: number;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({ quantity, lowThreshold = 5 }) => {
  const status =
    quantity <= 0
      ? { color: "destructive", label: "Out of Stock" }
      : quantity <= lowThreshold
      ? { color: "warning", label: `Low Stock (${quantity})` }
      : { color: "success", label: "In Stock" };

  return (
    <div
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        {
          "bg-destructive/10 text-destructive": status.color === "destructive",
          "bg-warning/10 text-warning": status.color === "warning",
          "bg-success/10 text-success": status.color === "success",
        }
      )}
    >
      <span
        className={classNames("h-1.5 w-1.5 rounded-full", {
          "bg-destructive": status.color === "destructive",
          "bg-warning": status.color === "warning",
          "bg-success": status.color === "success",
        })}
      />
      {status.label}
    </div>
  );
};
