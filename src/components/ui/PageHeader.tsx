"use client";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  size?: "md" | "lg";
};

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, kicker, actions, meta, size = "md" }) => {
  const titleClass = size === "lg" ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl sm:text-2xl";
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {kicker ? <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{kicker}</p> : null}
        <h1 className={`${titleClass} font-bold text-foreground`}>{title}</h1>
        {subtitle ? <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl">{subtitle}</p> : null}
        {meta ? <div className="mt-2 text-xs text-muted-foreground">{meta}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 flex-shrink-0">{actions}</div> : null}
    </div>
  );
};
