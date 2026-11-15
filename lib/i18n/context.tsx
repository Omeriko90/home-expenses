"use client";

import { createContext, useContext } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { dictionaries, dir, type Dictionary, type Locale } from "./dictionaries";

type I18nValue = {
  locale: Locale;
  t: Dictionary;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale] }}>
      {/* Radix primitives (Tabs, Select, Dropdown, Popover) read direction from
          here, not from the DOM `dir` attribute. */}
      <DirectionProvider dir={dir(locale)}>{children}</DirectionProvider>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
