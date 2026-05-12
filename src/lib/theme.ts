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
      "--color-btn-primary-bg": "#1a9e6b",
      "--color-btn-primary-text": "#ffffff",
      "--color-btn-primary-hover-bg": "#158c5e",
      "--color-btn-secondary-bg": "#e4dfd6",
      "--color-btn-secondary-border": "#d4cfc5",
      "--color-btn-secondary-text": "#2c2820",
      "--color-btn-secondary-hover-bg": "#ddd8ce",
      "--color-btn-secondary-hover-border": "#b8b2a6",
      "--color-btn-secondary-hover-text": "#2c2820",
      "--color-status-error-bg": "rgba(184, 56, 56, 0.08)",
      "--color-status-error-border": "rgba(184, 56, 56, 0.2)",
      "--color-status-error-text": "#b83838",
      "--color-status-success-bg": "rgba(26, 158, 107, 0.08)",
      "--color-status-success-border": "rgba(26, 158, 107, 0.2)",
      "--color-status-success-text": "#1a9e6b",
      "--color-status-warning-bg": "rgba(192, 106, 40, 0.08)",
      "--color-status-warning-border": "rgba(192, 106, 40, 0.2)",
      "--color-status-warning-text": "#c06a28",
      "--color-status-info-bg": "rgba(58, 122, 188, 0.08)",
      "--color-status-info-border": "rgba(58, 122, 188, 0.2)",
      "--color-status-info-text": "#3a7abc",
      "--color-modal-overlay": "rgba(0, 0, 0, 0.4)",
      "--color-ink-wash-1": "rgba(26, 158, 107, 0.04)",
      "--color-ink-wash-2": "rgba(58, 122, 188, 0.03)",
      "--color-ink-wash-3": "rgba(192, 106, 40, 0.03)",
      "--color-stripe-line": "rgba(0, 0, 0, 0.03)",
      "--color-role-general": "#b83838",
      "--color-role-general-bg": "rgba(184, 56, 56, 0.08)",
      "--color-role-general-border": "rgba(184, 56, 56, 0.15)",
      "--color-role-diplomat": "#3a7abc",
      "--color-role-diplomat-bg": "rgba(58, 122, 188, 0.08)",
      "--color-role-diplomat-border": "rgba(58, 122, 188, 0.15)",
      "--color-role-intel": "#7c5cbf",
      "--color-role-intel-bg": "rgba(124, 92, 191, 0.08)",
      "--color-role-intel-border": "rgba(124, 92, 191, 0.15)",
      "--color-role-scholar": "#1a9e6b",
      "--color-role-scholar-bg": "rgba(26, 158, 107, 0.08)",
      "--color-role-scholar-border": "rgba(26, 158, 107, 0.15)",
      "--color-role-merchant": "#c06a28",
      "--color-role-merchant-bg": "rgba(192, 106, 40, 0.08)",
      "--color-role-merchant-border": "rgba(192, 106, 40, 0.15)",
      "--color-tab-chronicle": "#1a9e6b",
      "--color-tab-cabinet": "#c06a28",
      "--color-tab-intelligence": "#3a7abc",
      "--shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.1)",
      "--shadow-md": "0 4px 12px rgba(0, 0, 0, 0.12)",
      "--shadow-lg": "0 10px 30px rgba(0, 0, 0, 0.15)",
      "--shadow-glow": "0 0 24px rgba(26, 158, 107, 0.08)",
      "--shadow-card":
        "0 2px 8px rgba(0, 0, 0, 0.06), 0 0 1px rgba(26, 158, 107, 0.03)",
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

    const themeColor =
      name === "light"
        ? getComputedStyle(root)
            .getPropertyValue("--color-bg-primary")
            .trim() || "#f0ece4"
        : getComputedStyle(root)
            .getPropertyValue("--color-bg-primary")
            .trim() || "#0A0A0A";
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", themeColor);
    }
  }
}

export function getAvailableThemes(): ThemeConfig[] {
  return Object.values(themes);
}
