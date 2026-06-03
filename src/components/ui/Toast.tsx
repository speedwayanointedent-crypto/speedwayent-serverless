"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import classNames from "classnames";

export type ToastType = "success" | "error" | "info";

export type ToastState = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toasts: ToastState[];
  push: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let idCounter = 1;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const push = useCallback((message: string, type: ToastType = "info") => {
    const id = idCounter++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 space-y-2 sm:left-auto sm:right-4 sm:max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={classNames(
              "glass-card border px-4 py-2 text-sm flex items-center gap-2",
              {
                "border-emerald-500/50 text-emerald-100": toast.type === "success",
                "border-rose-500/50 text-rose-100": toast.type === "error",
                "border-border text-foreground": toast.type === "info",
              }
            )}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
