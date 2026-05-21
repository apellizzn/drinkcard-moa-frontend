import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  markClassName?: string;
}

export function BrandLogo({ className, markClassName }: BrandLogoProps) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="DrinkCard MOA">
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-11 w-7 shrink-0 flex-col items-center justify-center font-display text-sm leading-[0.82] text-primary",
            markClassName,
          )}
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
