"use client";

import { useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import classNames from "classnames";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  loading?: boolean;
  autoFocus?: boolean;
  debouncing?: boolean;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md" | "lg";
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  loading = false,
  autoFocus = false,
  debouncing = false,
  className,
  inputClassName,
  size = "md",
  onKeyDown,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleClear = useCallback(() => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  const sizeClasses = { sm: "h-9 text-sm pl-9 pr-8", md: "h-11 text-sm pl-11 pr-10", lg: "h-12 text-base pl-12 pr-10" };
  const iconSizes = { sm: "h-4 w-4 left-3", md: "h-5 w-5 left-4", lg: "h-5 w-5 left-4" };
  const clearSizes = { sm: "h-6 w-6 right-2", md: "h-7 w-7 right-3", lg: "h-8 w-8 right-3" };

  return (
    <div className={classNames("relative", className)}>
      <div className={classNames("absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground", iconSizes[size])}>
        {loading || debouncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className={iconSizes[size]} />}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={classNames(
          "input w-full transition-all duration-200",
          "focus:ring-2 focus:ring-primary/20 focus:border-primary",
          sizeClasses[size],
          inputClassName
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className={classNames(
            "absolute top-1/2 -translate-y-1/2 rounded-full",
            "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200",
            clearSizes[size]
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

interface SearchResultsProps<T> {
  results: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  selectedIndex?: number;
  onSelect?: (item: T, index: number) => void;
  maxHeight?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  loading?: boolean;
  className?: string;
}

export function SearchResults<T>({
  results,
  renderItem,
  selectedIndex = -1,
  onSelect,
  maxHeight = "max-h-[400px]",
  emptyMessage = "No results found",
  emptyDescription,
  loading = false,
  className,
}: SearchResultsProps<T>) {
  if (loading) {
    return (
      <div className={classNames("flex items-center justify-center py-12", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Searching...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={classNames("text-center py-12 px-4", className)}>
        <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
        {emptyDescription && <p className="text-xs text-muted-foreground mt-1">{emptyDescription}</p>}
      </div>
    );
  }

  return (
    <div className={classNames("overflow-y-auto rounded-xl border border-border bg-card shadow-lg", maxHeight, className)}>
      <div className="space-y-1 p-2">
        {results.map((item, index) => (
          <div
            key={index}
            onClick={() => onSelect?.(item, index)}
            className={classNames("cursor-pointer transition-colors rounded-lg", selectedIndex === index && "bg-primary/10")}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
