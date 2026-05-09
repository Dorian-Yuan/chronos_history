import zh from "./locales/zh.json";
import en from "./locales/en.json";

type LocaleKey = string;

const locales: Record<string, Record<string, unknown>> = { zh, en };

const DEFAULT_LOCALE = "zh";

let currentLocale = DEFAULT_LOCALE;

function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== "object"
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

export function t(
  key: LocaleKey,
  params?: Record<string, string | number>,
): string {
  const locale = locales[currentLocale] || locales[DEFAULT_LOCALE];
  let value = getNestedValue(locale, key);
  if (value === undefined) {
    value = getNestedValue(locales[DEFAULT_LOCALE], key);
  }
  if (value === undefined) {
    return key;
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value!.replace(`{${k}}`, String(v));
    });
  }
  return value;
}

export function setLocale(locale: string): void {
  if (locales[locale]) {
    currentLocale = locale;
    if (typeof window !== "undefined") {
      localStorage.setItem("chronos_locale", locale);
    }
  }
}

export function getLocale(): string {
  return currentLocale;
}

export function initLocale(): void {
  const saved = localStorage.getItem("chronos_locale");
  if (saved && locales[saved]) {
    currentLocale = saved;
  } else {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("zh")) {
      currentLocale = "zh";
    } else {
      currentLocale = "en";
    }
  }
}

export function getAvailableLocales(): string[] {
  return Object.keys(locales);
}

export { locales };
