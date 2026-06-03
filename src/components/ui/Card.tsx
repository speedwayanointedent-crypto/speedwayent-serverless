"use client";

import React from "react";
import classNames from "classnames";

type CardVariant = "default" | "elevated" | "glass" | "bordered";
type CardPadding = "none" | "sm" | "md" | "lg";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  padding = "md",
  hover = false,
  className,
  ...props
}) => {
  const variants = {
    default: "border border-border/60 shadow-card",
    elevated: "shadow-lg border-0",
    glass: "border border-white/15 bg-white/60 backdrop-blur-xl dark:bg-slate-900/60 dark:border-slate-700/20",
    bordered: "border border-border shadow-sm",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={classNames(
        "rounded-2xl bg-card text-card-foreground transition-all duration-200",
        variants[variant],
        paddings[padding],
        hover && "hover:shadow-card-hover hover:border-border/80 hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={classNames("flex flex-col space-y-1.5 pb-4", className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={classNames("text-lg font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => (
  <p className={classNames("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={classNames("", className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={classNames("flex items-center pt-4 border-t border-border/60", className)} {...props}>
    {children}
  </div>
);
