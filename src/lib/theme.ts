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
      "--color-accent-primary": "#8b6914",
      "--color-accent-secondary": "#6b5238",
      "--color-accent-success": "#3d7a4a",
      "--color-accent-warning": "#9e7518",
      "--color-accent-danger": "#a83838",
      "--color-accent-info": "#4a7a8c",
      "--color-border": "#d4cfc5",
      "--color-border-hover": "#b8b2a6",
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

    const themeColor = name === "light" ? "#f0ece4" : "#0d0f14";
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }
  }
}

export function getAvailableThemes(): ThemeConfig[] {
  return Object.values(themes);
}
