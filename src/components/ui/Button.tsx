"use client";

import { Loader2 } from "lucide-react";
import classNames from "classnames";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "success" | "whatsapp";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconPosition = "left",
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 shadow-soft hover:shadow-md",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    outline: "border border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground/30",
    ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
    destructive: "bg-destructive text-white hover:bg-destructive/90",
    success: "bg-success text-white hover:bg-success/90 shadow-soft",
    whatsapp: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-soft",
  };

  const sizes = {
    sm: "h-9 px-3 text-xs rounded-lg",
    md: "h-10 px-5 py-2 rounded-xl text-sm",
    lg: "h-12 px-8 text-base rounded-xl",
    icon: "h-10 w-10 p-0 rounded-full",
  };

  return (
    <button
      className={classNames(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : icon && iconPosition === "left" ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
      {icon && !loading && iconPosition === "right" && <span className="ml-2">{icon}</span>}
    </button>
  );
};
