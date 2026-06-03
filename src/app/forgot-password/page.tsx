"use client";

import React from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { apiPost } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PublicFooterCTA } from "@/components/layout/PublicFooterCTA";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { push } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/auth/forgot-password", { email });
      push("If that email exists, a reset link was sent.", "info");
    } catch {
      push("Failed to request password reset", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto flex max-w-4xl items-center justify-center px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="w-full max-w-md card p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we will send a secure reset link.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                required
                className="form-input mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? "Submitting..." : "Send reset link"}
            </button>
          </form>
        </div>
      </main>
      <PublicFooterCTA />
    </div>
  );
}
