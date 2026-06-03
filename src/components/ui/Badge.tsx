"use client";

import React from "react";
import classNames from "classnames";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "muted" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className,
  ...props
}) => {
  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-transparent",
    outline: "bg-transparent border border-border text-foreground",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-0.5 text-xs",
  };

  const dotColors = {
    default: "bg-primary",
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    muted: "bg-muted-foreground",
    outline: "bg-foreground",
  };

  return (
    <span
      className={classNames(
        "inline-flex items-center font-semibold rounded-full border transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && <span className={classNames("mr-1.5 h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: "success" | "warning" | "destructive" | "muted" | "primary"; label: string }> = ({
  status,
  label,
}) => <Badge variant={status} dot>{label}</Badge>;
