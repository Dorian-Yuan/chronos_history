export interface ThemeConfig {
  name: string;
  label: string;
  labelEn: string;
  variables: Record<string, string>;
}

const themes: Record<string, ThemeConfig> = {
  dark: {
    name: "dark",
    label: "墨韵深色",
    labelEn: "Ink Dark",
    variables: {},
  },
  light: {
    name: "light",
    label: "宣纸浅色",
    labelEn: "Rice Paper",
    variables: {
      "--color-bg-primary": "#f0ece4",
      "--color-bg-secondary": "#faf7f2",
      "--color-bg-tertiary": "#e4dfd6",
      "--color-bg-card": "#ffffff",
      "--color-bg-hover": "#ebe7df",
      "--color-bg-active": "#ddd8ce",
      "--color-text-primary": "#2c2820",
      "--color-text-secondary": "#6b6558",
      "--color-text-tertiary": "#9e9688",
      "--color-text-inverse": "#faf7f2",
      "--color-accent-primary": "#1a9e6b",
      "--color-accent-secondary": "#c06a28",
      "--color-accent-success": "#1a9e6b",
      "--color-accent-warning": "#c06a28",
      "--color-accent-danger": "#b83838",
      "--color-accent-info": "#3a7abc",
      "--color-border": "#d4cfc5",
      "--color-border-hover": "#b8b2a6",
      "--color-glass-bg": "rgba(240, 236, 228, 0.88)",
      "--color-glass-border": "rgba(0, 0, 0, 0.05)",
      "--color-glass-subtle-bg": "rgba(240, 236, 228, 0.65)",
      "--color-glass-subtle-border": "rgba(0, 0, 0, 0.03)",
      "--color-glass-card-bg": "rgba(255, 255, 255, 0.75)",
      "--shadow-accent-sm": "0 2px 8px rgba(26, 158, 107, 0.2)",
      "--shadow-accent-md": "0 4px 16px rgba(26, 158, 107, 0.3)",
      "--shadow-accent-xs": "0 1px 4px rgba(26, 158, 107, 0.15)",
      "--color-accent-focus": "rgba(26, 158, 107, 0.5)",
      "--color-accent-ring": "rgba(26, 158, 107, 0.08)",
      "--color-accent-hover-border": "rgba(26, 158, 107, 0.3)",
      "--color-accent-hover-glow": "rgba(26, 158, 107, 0.06)",
      "--color-accent-glow-sm": "rgba(26, 158, 107, 0.15)",
      "--color-accent-glow-md": "rgba(26, 158, 107, 0.3)",
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

    const themeColor = name === "light" ? "#f0ece4" : "#0A0A0A";
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }
  }
}

export function getAvailableThemes(): ThemeConfig[] {
  return Object.values(themes);
}
