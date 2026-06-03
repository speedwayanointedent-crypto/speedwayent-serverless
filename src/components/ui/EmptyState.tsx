"use client";

import { Package } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
};

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 mb-5">
      {icon || <Package className="h-7 w-7 text-muted-foreground/60" />}
    </div>
    <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
    {description ? <p className="text-sm text-muted-foreground max-w-sm">{description}</p> : null}
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
);
