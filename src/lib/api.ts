"use client";

import { getToken, clearAuth, isTokenExpired } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";
const DEFAULT_TIMEOUT = 60_000;
const UPLOAD_TIMEOUT = 120_000;
const MAX_RETRIES = 3;
const BASE_DELAY = 500;
const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);
const NON_RETRY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type ApiOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  skipRetry?: boolean;
  retries?: number;
};

function buildUrl(url: string, params?: ApiOptions["params"]) {
  let path = url;
  if (path.startsWith("/") && !path.startsWith("/api/") && !path.startsWith("/_next/")) {
    path = "/api" + path;
  }
  if (!params) return (API_BASE_URL + path).replace(/([^:]\/)\/+/g, "$1");
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.append(k, String(v));
  });
  const sep = path.includes("?") ? "&" : "?";
  return (API_BASE_URL + path + (qs.toString() ? sep + qs.toString() : "")).replace(/([^:]\/)\/+/g, "$1");
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shouldRetry(method: string, status?: number) {
  if (!method) return false;
  if (status && status >= 400 && status < 500) return RETRYABLE.has(status);
  if (!status) return true;
  if (RETRYABLE.has(status)) return true;
  return false;
}

function extractErrorMessage(data: any, status: number) {
  if (data && typeof data === "object") {
    return data.error || data.message || `Server error (${status})`;
  }
  return `Server error (${status})`;
}

export async function apiRequest<T = any>(url: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const fullUrl = buildUrl(url, options.params);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = getToken();
  if (token && !isTokenExpired(token)) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const isFormData = options.body instanceof FormData;
  if (isFormData) delete headers["Content-Type"];

  const maxRetries = options.skipRetry ? 0 : options.retries ?? MAX_RETRIES;
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout ?? DEFAULT_TIMEOUT);

    try {
      const res = await fetch(fullUrl, {
        ...options,
        method,
        headers,
        body: options.body,
        signal: controller.signal,
        credentials: "include",
      });
      clearTimeout(timeout);

      if (res.status === 401) {
        if (!url.includes("/auth/login") && !url.includes("/auth/signup")) {
          clearAuth();
        }
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = extractErrorMessage(data, res.status);
        const err: any = new Error(message);
        err.status = res.status;
        err.data = data;
        if (res.status >= 400 && res.status < 500) throw err;
        lastError = err;
        if (attempt < maxRetries) {
          await sleep(BASE_DELAY * Math.pow(2, attempt) + Math.random() * 200);
          continue;
        }
        throw err;
      }

      if (res.status === 204) return undefined as T;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        return (await res.json()) as T;
      }
      return (await res.text()) as unknown as T;
    } catch (err: any) {
      clearTimeout(timeout);
      lastError = err;
      const isAbort = err?.name === "AbortError";
      const status = err?.status as number | undefined;
      const retriable = isAbort || shouldRetry(method, status);
      if (NON_RETRY.has(method)) {
        throw err;
      }
      if (retriable && attempt < maxRetries) {
        await sleep(BASE_DELAY * Math.pow(2, attempt) + Math.random() * 200);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export const apiGet = <T = any>(url: string, options?: ApiOptions) =>
  apiRequest<T>(url, { ...options, method: "GET" });

export const apiPost = <T = any>(url: string, body?: any, options?: ApiOptions) =>
  apiRequest<T>(url, { ...options, method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });

export const apiPut = <T = any>(url: string, body?: any, options?: ApiOptions) =>
  apiRequest<T>(url, { ...options, method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined });

export const apiPatch = <T = any>(url: string, body?: any, options?: ApiOptions) =>
  apiRequest<T>(url, { ...options, method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined });

export const apiDelete = <T = any>(url: string, options?: ApiOptions) =>
  apiRequest<T>(url, { ...options, method: "DELETE" });

export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiGet("/api/health", { timeout: 5000, skipRetry: true });
    return true;
  } catch {
    return false;
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const anyErr = error as any;
    if (anyErr.data?.error) return anyErr.data.error;
    if (anyErr.status === 401) return "You need to sign in to continue.";
    if (anyErr.status === 403) return "You don't have permission for this action.";
    if (anyErr.status === 404) return "Not found.";
    if (anyErr.status === 429) return "Too many requests. Please try again later.";
    if (anyErr.status && anyErr.status >= 500) return "Server error. Please try again shortly.";
    if (anyErr.name === "AbortError") return "Request timed out. Please try again.";
    return anyErr.message;
  }
  return "An unexpected error occurred.";
}

export { UPLOAD_TIMEOUT };
