"use client";

import React from "react";
import { apiGet } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

type Health = { status: string };

export default function AdminSystemHealthPage() {
  const [health, setHealth] = React.useState<Health | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<Health>("/health");
        setHealth(res);
      } catch {
        setHealth(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader title="System health" subtitle="API uptime and service checks." />
      <div className="card p-5">
        {loading ? (
          <Skeleton className="h-20" />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">API status</div>
              <div className="text-lg font-semibold text-foreground">
                {health?.status === "ok" ? "Online" : "Unknown"}
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                health?.status === "ok"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
              }`}
            >
              {health?.status || "offline"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
