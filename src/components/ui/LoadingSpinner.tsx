"use client";

import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "Loading...", size = "md", className = "" }) => {
  const sizeClasses = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  const textSizeClasses = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {text && <p className={`text-muted-foreground ${textSizeClasses[size]}`}>{text}</p>}
    </div>
  );
};

export const PageLoading: React.FC<{ text?: string }> = ({ text }) => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        <div className="absolute inset-0 rounded-2xl animate-ping bg-primary/5" />
      </div>
      <p className="text-sm text-muted-foreground font-medium">{text || "Loading..."}</p>
    </div>
  </div>
);
