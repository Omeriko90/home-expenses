import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/i18n/server";
import { dir } from "@/lib/i18n/dictionaries";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "@/components/ui/sonner";

const heebo = Heebo({
  variable: "--font-sans",
  subsets: ["latin", "hebrew"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ניהול הוצאות והשקעות",
  description: "Household expenses & investments",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      dir={dir(locale)}
      className={`${heebo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-background text-foreground min-h-full flex flex-col">
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <Toaster />
      </body>
    </html>
  );
}
