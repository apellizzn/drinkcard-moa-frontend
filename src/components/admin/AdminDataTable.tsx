import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { translateStatus } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";

interface AdminDataTableProps {
  title?: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function AdminDataTable({
  title,
  description,
  children,
  actions,
  className,
}: AdminDataTableProps) {
  return (
    <section className={cn("admin-panel overflow-hidden", className)}>
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-slate-950">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function AdminTable({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn("admin-table", className)}>{children}</table>;
}

export function AdminEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();
  const normalized = status.toUpperCase();
  const classes: Record<string, string> = {
    ACTIVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CONFIRMADO: "border-emerald-200 bg-emerald-50 text-emerald-700",
    SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CONSUMED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PENDING: "border-amber-200 bg-amber-50 text-amber-700",
    PENDIENTE: "border-amber-200 bg-amber-50 text-amber-700",
    FAILED: "border-red-200 bg-red-50 text-red-700",
    EXPIRED: "border-slate-200 bg-slate-100 text-slate-600",
    INACTIVE: "border-slate-200 bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        classes[normalized] ?? "border-slate-200 bg-slate-100 text-slate-600",
      )}
    >
      {translateStatus(language, status)}
    </span>
  );
}
