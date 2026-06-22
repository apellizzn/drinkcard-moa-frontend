import { enUS, es, fr, it } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { Language, TranslationKey } from "./translations";

export const dateLocales: Record<Language, Locale> = {
  it,
  en: enUS,
  fr,
  es,
};

export function drinkKey(drinkType: string): TranslationKey {
  return `drink.${drinkType}` as TranslationKey;
}

export function statusKey(status: string): TranslationKey {
  return `status.${status.toUpperCase()}` as TranslationKey;
}
