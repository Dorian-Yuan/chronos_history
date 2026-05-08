export interface ThemeConfig {
  name: string;
  label: string;
  labelEn: string;
  variables: Record<string, string>;
}

const themes: Record<string, ThemeConfig> = {
  dark: {
    name: "dark",
    label: "深色",
    labelEn: "Dark",
    variables: {},
  },
  light: {
    name: "light",
    label: "浅色",
    labelEn: "Light",
    variables: {
      "--color-bg-primary": "#f5f5f5",
      "--color-bg-secondary": "#ffffff",
      "--color-bg-tertiary": "#e8e8e8",
      "--color-bg-card": "#ffffff",
      "--color-bg-hover": "#eeeeee",
      "--color-bg-active": "#e0e0e0",
      "--color-text-primary": "#1a1a1a",
      "--color-text-secondary": "#555555",
      "--color-text-tertiary": "#888888",
      "--color-text-inverse": "#ffffff",
      "--color-accent-primary": "#2563eb",
      "--color-accent-secondary": "#7c3aed",
      "--color-accent-success": "#16a34a",
      "--color-accent-warning": "#d97706",
      "--color-accent-danger": "#dc2626",
      "--color-accent-info": "#0284c7",
      "--color-border": "#d4d4d4",
      "--color-border-hover": "#b0b0b0",
    },
  },
};

export function getTheme(name?: string): ThemeConfig {
  const themeName = name || localStorage.getItem("chronos_theme") || "dark";
  return themes[themeName] || themes.dark;
}

export function setTheme(name: string): void {
  if (themes[name]) {
    localStorage.setItem("chronos_theme", name);
    const previousTheme = getTheme(
      localStorage.getItem("chronos_prev_theme") || "dark",
    );
    const root = document.documentElement;
    Object.keys(previousTheme.variables).forEach((key) => {
      root.style.removeProperty(key);
    });
    const theme = themes[name];
    Object.entries(theme.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem("chronos_prev_theme", name);
  }
}

export function getAvailableThemes(): ThemeConfig[] {
  return Object.values(themes);
}
