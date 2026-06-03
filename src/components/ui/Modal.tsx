"use client";

import { X } from "lucide-react";
import classNames from "classnames";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = "md" }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className={classNames(
          "relative w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-border/60 bg-card text-card-foreground shadow-xl animate-scale-in-soft",
          { "max-w-sm": size === "sm", "max-w-lg": size === "md", "max-w-2xl": size === "lg" }
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className={classNames("p-6", !title && "pt-6")}>
          {!title && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};
