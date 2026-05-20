import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type Color = "pink" | "yellow" | "cyan" | "orange" | "lime" | "violet";

// All stickers use black text for maximum contrast on the bright palette.
const colorMap: Record<Color, string> = {
  pink: "bg-neon-pink text-foreground",
  yellow: "bg-neon-yellow text-foreground",
  cyan: "bg-neon-cyan text-background",
  orange: "bg-neon-orange text-foreground",
  lime: "bg-neon-lime text-foreground",
  violet: "bg-neon-violet text-foreground",
};

export function Sticker({
  children,
  color = "pink",
  rotate = -4,
  className,
  float,
  size = "md",
}: {
  children: ReactNode;
  color?: Color;
  rotate?: number;
  className?: string;
  float?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-5 py-2 text-base",
  };
  const bgClass = colorMap[color].split(" ")[0];
  const textClass = colorMap[color].split(" ")[1];
  return (
    <span
      className={cn(
        "inline-flex items-center font-display uppercase tracking-wider sticker rounded-full",
        bgClass,
        textClass,
        sizeMap[size],
        float && "animate-float",
        className,
      )}
      style={{ transform: `rotate(${rotate}deg)`, "--r": `${rotate}deg` } as CSSProperties}
    >
      {children}
    </span>
  );
}
