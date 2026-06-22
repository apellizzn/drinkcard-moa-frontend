import { Check, Languages } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { useLanguage } from "@/lib/i18n-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageMenu({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const current = LANGUAGES.find((item) => item.code === language) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("language.change")}
          title={t("language.change")}
          className={
            className ??
            "inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-foreground/10 bg-card px-3 font-display text-sm hover:bg-muted transition-colors"
          }
        >
          <Languages className="h-4 w-4" />
          <span>{current.shortLabel}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("language.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LANGUAGES.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => setLanguage(item.code)}
            className="flex cursor-pointer items-center justify-between gap-2"
          >
            <span>{item.label}</span>
            {item.code === language && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
