import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE,
  dateFnsLocales,
  getIntlLocale,
  getLanguageMeta,
  getStoredLanguage,
  storeLanguage,
  translate,
  type LanguageCode,
  type TranslationKey,
} from "@/lib/i18n";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  dateLocale: (typeof dateFnsLocales)[LanguageCode];
  intlLocale: string;
};

const fallbackContext: LanguageContextValue = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, values) => translate(DEFAULT_LANGUAGE, key, values),
  dateLocale: dateFnsLocales[DEFAULT_LANGUAGE],
  intlLocale: getIntlLocale(DEFAULT_LANGUAGE),
};

const LanguageContext = createContext<LanguageContextValue>(fallbackContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    setLanguageState(getStoredLanguage());
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = getLanguageMeta(language).htmlLang;
    }
  }, [language]);

  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    storeLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string | number>) =>
      translate(language, key, values),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      dateLocale: dateFnsLocales[language],
      intlLocale: getIntlLocale(language),
    }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
