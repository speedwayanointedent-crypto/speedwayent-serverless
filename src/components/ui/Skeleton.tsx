"use client";

import classNames from "classnames";

type Props = { className?: string };

export const Skeleton: React.FC<Props> = ({ className }) => (
  <div
    className={classNames(
      "relative overflow-hidden rounded-xl bg-muted/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent dark:before:via-white/10",
      className
    )}
  />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 1, className }) => (
  <div className={classNames("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={classNames("h-3.5 rounded-md", i === lines - 1 && lines > 1 ? "w-3/4" : "w-full")}
      />
    ))}
  </div>
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
    <Skeleton className="aspect-[4/3] rounded-none" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <Skeleton className="h-3.5 w-1/2 rounded-md" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3.5">
        <Skeleton
          className={classNames("h-4 rounded-md", i === 0 ? "w-40" : i === cols - 1 ? "w-16" : "w-24")}
        />
      </td>
    ))}
  </tr>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-border/60 bg-card p-5">
    <div className="flex items-start justify-between">
      <div className="space-y-2.5">
        <Skeleton className="h-3.5 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-3 w-24 rounded-md" />
      </div>
      <Skeleton className="h-12 w-12 rounded-xl" />
    </div>
  </div>
);
