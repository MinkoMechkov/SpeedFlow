import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["bg", "en"],
  defaultLocale: "bg",
  localePrefix: "always",
});

export type AppLocale = (typeof routing.locales)[number];

export function intlLocale(locale: string): string {
  return locale === "bg" ? "bg-BG" : "en-GB";
}
