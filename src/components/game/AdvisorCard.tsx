import { useState } from "react";
import type { AdvisorData, AdvisorRole } from "@/types";
import { Shield, Scroll, Eye, BookOpen, Coins } from "lucide-react";

interface AdvisorCardProps {
  advisor: AdvisorData;
}

const ROLE_CONFIG: Record<
  AdvisorRole,
  {
    label: string;
    icon: typeof Shield;
    colorVar: string;
    bgColorVar: string;
    borderColorVar: string;
  }
> = {
  General: {
    label: "将军",
    icon: Shield,
    colorVar: "--color-role-general",
    bgColorVar: "--color-role-general-bg",
    borderColorVar: "--color-role-general-border",
  },
  Diplomat: {
    label: "外交官",
    icon: Scroll,
    colorVar: "--color-role-diplomat",
    bgColorVar: "--color-role-diplomat-bg",
    borderColorVar: "--color-role-diplomat-border",
  },
  Intel: {
    label: "密探",
    icon: Eye,
    colorVar: "--color-role-intel",
    bgColorVar: "--color-role-intel-bg",
    borderColorVar: "--color-role-intel-border",
  },
  Scholar: {
    label: "学者",
    icon: BookOpen,
    colorVar: "--color-role-scholar",
    bgColorVar: "--color-role-scholar-bg",
    borderColorVar: "--color-role-scholar-border",
  },
  Merchant: {
    label: "商人",
    icon: Coins,
    colorVar: "--color-role-merchant",
    bgColorVar: "--color-role-merchant-bg",
    borderColorVar: "--color-role-merchant-border",
  },
};

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const config = ROLE_CONFIG[advisor.role];
  const [showMotive, setShowMotive] = useState(false);
  if (!config) return null;

  const Icon = config.icon;

  const roleColor = `var(${config.colorVar})`;
  const roleBgColor = `var(${config.bgColorVar})`;
  const roleBorderColor = `var(${config.borderColorVar})`;

  return (
    <div
      className="rounded-lg border bg-bg-secondary p-4 transition-all hover:border-border-hover"
      style={{ borderColor: roleBorderColor }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: roleBgColor }}
        >
          <Icon size={14} style={{ color: roleColor }} aria-hidden="true" />
        </div>
        <span className="text-sm" style={{ color: roleColor }}>
          {config.label}
        </span>
        <span className="text-sm font-serif text-text-secondary">// {advisor.name}</span>
      </div>

      <p className="mt-2 text-sm font-serif text-text-primary font-medium leading-relaxed">
        &ldquo;{advisor.advice}&rdquo;
      </p>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs font-serif text-text-tertiary">
          倾向：{advisor.bias}
        </div>

        {advisor.hidden_motive && (
          <button
            onClick={() => setShowMotive(!showMotive)}
            className="flex items-center gap-1 text-xs font-serif text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label={showMotive ? "隐藏秘密动机" : "查看秘密动机"}
          >
            {showMotive ? "▲ 隐藏动机" : "▼ 秘密动机"}
          </button>
        )}
      </div>

      {advisor.hidden_motive && showMotive && (
        <div className="mt-4 rounded-md border border-border bg-bg-card p-3.5">
          <p className="text-xs font-serif italic leading-relaxed text-accent-secondary">
            {advisor.hidden_motive}
          </p>
        </div>
      )}
    </div>
  );
}
