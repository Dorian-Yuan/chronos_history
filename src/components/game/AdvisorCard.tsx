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
    borderColor: string;
    bgColor: string;
    textColor: string;
    iconBg: string;
  }
> = {
  General: {
    label: "将军",
    icon: Shield,
    borderColor: "border-red-800/30",
    bgColor: "bg-red-900/8",
    textColor: "text-red-400",
    iconBg: "bg-red-900/15",
  },
  Diplomat: {
    label: "外交官",
    icon: Scroll,
    borderColor: "border-blue-800/30",
    bgColor: "bg-blue-900/8",
    textColor: "text-blue-400",
    iconBg: "bg-blue-900/15",
  },
  Intel: {
    label: "密探",
    icon: Eye,
    borderColor: "border-emerald-800/30",
    bgColor: "bg-emerald-900/8",
    textColor: "text-emerald-400",
    iconBg: "bg-emerald-900/15",
  },
  Scholar: {
    label: "学者",
    icon: BookOpen,
    borderColor: "border-purple-800/30",
    bgColor: "bg-purple-900/8",
    textColor: "text-purple-400",
    iconBg: "bg-purple-900/15",
  },
  Merchant: {
    label: "商人",
    icon: Coins,
    borderColor: "border-amber-800/30",
    bgColor: "bg-amber-900/8",
    textColor: "text-amber-400",
    iconBg: "bg-amber-900/15",
  },
};

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const config = ROLE_CONFIG[advisor.role];
  const [showMotive, setShowMotive] = useState(false);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-5 transition-all hover:brightness-110`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.iconBg}`}
        >
          <Icon size={15} className={config.textColor} aria-hidden="true" />
        </div>
        <div>
          <div
            className={`font-mono text-[10px] uppercase tracking-widest ${config.textColor}`}
          >
            {config.label}
          </div>
          <div className="text-sm font-medium text-text-primary">
            {advisor.name}
          </div>
        </div>
      </div>

      <p className="font-serif text-xs italic leading-relaxed text-text-secondary">
        &ldquo;{advisor.advice}&rdquo;
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span className={`badge ${config.bgColor} ${config.textColor}`}>
          {advisor.bias}
        </span>
        {advisor.hidden_motive && (
          <button
            onClick={() => setShowMotive(!showMotive)}
            className="text-[10px] text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label={showMotive ? "隐藏秘密动机" : "查看秘密动机"}
          >
            {showMotive ? "▲ 隐藏动机" : "▼ 秘密动机"}
          </button>
        )}
      </div>

      {advisor.hidden_motive && showMotive && (
        <div className="mt-3 rounded-md border border-amber-800/20 bg-amber-900/10 px-4 py-3">
          <p className="font-serif text-[11px] italic leading-relaxed text-amber-400/70">
            {advisor.hidden_motive}
          </p>
        </div>
      )}
    </div>
  );
}
