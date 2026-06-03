"use client";

import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/lib/auth-context";
import { useEffect } from "react";

function HydrationScript() {
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const theme = stored || "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <HydrationScript />
          {children}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
