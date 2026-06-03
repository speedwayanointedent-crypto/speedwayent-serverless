"use client";

import React from "react";
import { Lock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooterCTA } from "@/components/layout/PublicFooterCTA";

function ResetPasswordPageInner() {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { push } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      push("Reset token is missing.", "error");
      return;
    }
    if (password.length < 6) {
      push("Password must be at least 6 characters.", "error");
      return;
    }
    if (password !== confirm) {
      push("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      await apiPost("/api/auth/reset-password", { token, password });
      push("Password updated. You can now sign in.", "success");
      router.push("/login");
    } catch (err) {
      const message = getApiErrorMessage(err) || "Reset failed. Request a new link.";
      push(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <div className="mx-auto flex min-h-screen max-w-2xl items-center px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="w-full card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Create a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a new password to secure your account.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="form-label">New password</label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Confirm password</label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>
            <button className="btn-primary h-11 w-full" disabled={loading}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
      <PublicFooterCTA />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="p-8">Loading...</div>}>
      <ResetPasswordPageInner />
    </React.Suspense>
  );
}
