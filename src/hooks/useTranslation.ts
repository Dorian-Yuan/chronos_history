import { useCallback, useSyncExternalStore } from "react";
import { t, setLocale, getLocale, getAvailableLocales } from "@/i18n";

let listeners: (() => void)[] = [];

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function useTranslation() {
  const locale = useSyncExternalStore(subscribe, getLocale);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return t(key, params);
    },
    [],
  );

  const changeLocale = useCallback((newLocale: string) => {
    setLocale(newLocale);
    emitChange();
  }, []);

  return {
    t: translate,
    locale,
    setLocale: changeLocale,
    availableLocales: getAvailableLocales(),
  };
}
