"use client";

import { DashboardShell } from "@/components/layout/Shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
