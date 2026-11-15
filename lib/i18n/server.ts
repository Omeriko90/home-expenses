import { cookies } from "next/headers";
import {
  dictionaries,
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
} from "./dictionaries";

export const LOCALE_COOKIE = "locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value as Locale | undefined;
  return value && LOCALES.includes(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary() {
  const locale = await getLocale();
  return dictionaries[locale];
}
