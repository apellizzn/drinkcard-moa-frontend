import { Globe2 } from "lucide-react";
import { useI18n, isLanguage } from "@/i18n/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage, languageOptions, t } = useI18n();

  return (
    <label className="inline-flex items-center gap-1.5 rounded-xl border-2 border-foreground/10 bg-card px-2 py-1 text-sm font-medium">
      <Globe2 className="h-4 w-4" aria-hidden />
      <span className="sr-only">{t("language.label")}</span>
      <select
        aria-label={t("language.change")}
        value={language}
        onChange={(event) => {
          if (isLanguage(event.target.value)) setLanguage(event.target.value);
        }}
        className="bg-transparent font-display text-xs outline-none"
      >
        {languageOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.shortLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
