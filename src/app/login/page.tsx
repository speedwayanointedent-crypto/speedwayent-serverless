"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { apiPost, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser } from "@/lib/auth";
import type { UserRole } from "@/types/sale";
import { useToast } from "@/components/ui/Toast";
import { Eye, EyeOff, Mail, Lock, Car, Shield, Zap, Award } from "lucide-react";
import { PublicFooterCTA } from "@/components/layout/PublicFooterCTA";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { push } = useToast();
  const router = useRouter();
  const { setAuth } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiPost<{
        token: string;
        role?: string;
        user?: AuthUser;
        profile?: AuthUser;
      }>("/api/auth/login", { email, password });
      const role = (res.role || res.user?.role || res.profile?.role || "user") as UserRole;
      const user: AuthUser = res.user || res.profile || { id: "", email, role };
      setAuth(res.token, user);
      push("Logged in successfully", "success");
      router.push(role === "admin" ? "/admin" : "/shop");
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      push(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <PublicNavbar />
      <main className="mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl"></div>
            <div className="relative rounded-3xl bg-white dark:bg-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary to-primary/80 px-8 py-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Car className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Welcome Back</h2>
                    <p className="text-white/80 text-sm">Sign in to your account</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                  <Zap className="w-5 h-5 text-blue-500" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">Exclusive deals for registered members</p>
                </div>

                <form onSubmit={onSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        required
                        placeholder="you@example.com"
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        className="w-full h-14 pl-12 pr-14 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-14 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-semibold shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Signing in...
                      </span>
                    ) : "Sign In"}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                    Forgot your password?
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{" "}
                    <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                      Create one now
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <Shield className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Secure Login</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Fast Access</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
              <Award className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Premium Deals</p>
            </div>
          </div>
        </div>
      </main>
      <PublicFooterCTA />
    </div>
  );
}
