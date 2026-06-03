"use client";

type LoadingButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "outline" | "secondary" | "destructive";
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  const variantClasses = {
    primary: "btn-primary",
    outline: "btn-outline",
    secondary: "btn-secondary",
    destructive: "btn-destructive",
  };

  return (
    <button className={`${variantClasses[variant]} ${className} relative`} disabled={disabled || loading} {...props}>
      {loading && (
        <svg
          className="btn-spinner -ml-1 mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {loading && loadingText ? loadingText : children}
    </button>
  );
};
