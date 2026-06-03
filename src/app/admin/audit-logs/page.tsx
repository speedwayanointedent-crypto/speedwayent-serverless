"use client";

import React from "react";
import { apiGet } from "@/lib/api";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

type AuditLog = {
  id: number;
  action: string;
  entity: string;
  entity_id?: string | null;
  created_at: string;
  users?: { full_name?: string; email?: string };
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<AuditLog[]>("/audit-logs");
        setLogs(res || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader title="Audit logs" subtitle="Track admin and staff changes." />
      <div className="card p-4">
        {loading ? (
          <Skeleton className="h-40" />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit events"
            description="Actions will appear here as changes are made."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th className="text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-semibold">{log.action}</td>
                    <td>
                      {log.entity} {log.entity_id ? `#${log.entity_id}` : ""}
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {log.users?.full_name || log.users?.email || "—"}
                    </td>
                    <td className="text-right text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
