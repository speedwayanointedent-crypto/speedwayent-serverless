"use client";

import classNames from "classnames";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type StatVariant = "default" | "primary" | "success" | "warning" | "destructive";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: StatVariant;
  trend?: { value: number; label?: string };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = "default",
  trend,
  className,
}) => {
  const variants = {
    default: "bg-card",
    primary: "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
    success: "bg-gradient-to-br from-success/10 via-success/5 to-transparent",
    warning: "bg-gradient-to-br from-warning/10 via-warning/5 to-transparent",
    destructive: "bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent",
  };

  const iconVariants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
  };

  const trendColors = { positive: "text-success", negative: "text-destructive", neutral: "text-muted-foreground" };
  const dir = !trend ? "neutral" : trend.value > 0 ? "positive" : trend.value < 0 ? "negative" : "neutral";

  return (
    <div
      className={classNames(
        "rounded-2xl border border-border/60 p-5 shadow-soft transition-all duration-300 hover:shadow-soft-lg",
        variants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className={classNames("flex items-center gap-1 text-xs font-medium mt-1", trendColors[dir])}>
              {dir === "positive" && <TrendingUp className="h-3.5 w-3.5" />}
              {dir === "negative" && <TrendingDown className="h-3.5 w-3.5" />}
              {dir === "neutral" && <Minus className="h-3.5 w-3.5" />}
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && <span className="text-muted-foreground">{trend.label}</span>}
            </div>
          )}
        </div>
        {icon && <div className={classNames("rounded-xl p-3", iconVariants[variant])}>{icon}</div>}
      </div>
    </div>
  );
};

export const MiniStat: React.FC<{ label: string; value: string | number; icon?: React.ReactNode; className?: string }> = ({
  label,
  value,
  icon,
  className,
}) => (
  <div className={classNames("flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4", className)}>
    {icon && <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>}
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);
