import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
  to?: string;
}

export function BrandLogo({ className, markClassName, to = "/" }: BrandLogoProps) {
  return (
    <Link to={to as any} className={cn("flex items-center gap-2", className)} aria-label="DrinkCard MOA">
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 flex-col items-center justify-center font-display text-sm font-black leading-[0.68] text-primary",
            markClassName,
          )}
          style={{
            transform: "scaleX(1.5)",
            transformOrigin: "center",
          }}
        >
          <span>M</span>
          <span>O</span>
          <span>A</span>
        </span>
        <span className="font-display text-2xl tracking-wide">DrinkCard</span>
      </span>
    </Link>
  );
}
