"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { apiPost, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooterCTA } from "@/components/layout/PublicFooterCTA";

function VerifyEmailPageInner() {
  const [loading, setLoading] = React.useState(false);
  const { push } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const onVerify = async () => {
    if (!token) {
      push("Verification token is missing.", "error");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/api/auth/verify-email", { token });
      push("Email verified. You can now sign in.", "success");
      router.push("/login");
    } catch (err) {
      const message = getApiErrorMessage(err) || "Verification failed.";
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
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MailCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Verify your email</h1>
              <p className="text-sm text-muted-foreground">
                Confirm your email to activate your account.
              </p>
            </div>
          </div>
          <button className="btn-primary mt-6 h-11 w-full" onClick={onVerify} disabled={loading}>
            {loading ? "Verifying..." : "Verify email"}
          </button>
        </div>
      </div>
      <PublicFooterCTA />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense fallback={<div className="p-8">Loading...</div>}>
      <VerifyEmailPageInner />
    </React.Suspense>
  );
}
