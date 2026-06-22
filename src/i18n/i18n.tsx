import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  defaultLanguage,
  languages,
  translations,
  type Language,
  type TranslationKey,
} from "./translations";

const LANGUAGE_STORAGE_KEY = "drinkcard.language";

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  languageOptions: typeof languages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => detectInitialLanguage());

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
    window.dispatchEvent(new Event("drinkcard:language"));
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key, vars) =>
        interpolate(translations[language][key] ?? translations[defaultLanguage][key] ?? key, vars),
      languageOptions: languages,
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

export function isLanguage(value: string | null | undefined): value is Language {
  return languages.some((language) => language.code === value);
}

function detectInitialLanguage(): Language {
  if (typeof window === "undefined") return defaultLanguage;

  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isLanguage(stored)) return stored;

  const browserLanguage = navigator.language.split("-")[0];
  return isLanguage(browserLanguage) ? browserLanguage : defaultLanguage;
}

function interpolate(text: string, vars?: Record<string, string | number>) {
  if (!vars) return text;
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text,
  );
}
