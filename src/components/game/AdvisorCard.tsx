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
  }
> = {
  General: {
    label: "将军",
    icon: Shield,
    borderColor: "border-red-900/30",
    bgColor: "bg-red-900/10",
    textColor: "text-red-400",
  },
  Diplomat: {
    label: "外交官",
    icon: Scroll,
    borderColor: "border-blue-900/30",
    bgColor: "bg-blue-900/10",
    textColor: "text-blue-400",
  },
  Intel: {
    label: "密探",
    icon: Eye,
    borderColor: "border-emerald-900/30",
    bgColor: "bg-emerald-900/10",
    textColor: "text-emerald-400",
  },
  Scholar: {
    label: "学者",
    icon: BookOpen,
    borderColor: "border-purple-900/30",
    bgColor: "bg-purple-900/10",
    textColor: "text-purple-400",
  },
  Merchant: {
    label: "商人",
    icon: Coins,
    borderColor: "border-amber-900/30",
    bgColor: "bg-amber-900/10",
    textColor: "text-amber-400",
  },
};

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const config = ROLE_CONFIG[advisor.role];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-3 transition-all hover:brightness-110`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-md ${config.bgColor}`}
          >
            <Icon size={13} className={config.textColor} aria-hidden="true" />
          </div>
          <div>
            <div
              className={`font-mono text-xs uppercase tracking-wider ${config.textColor}`}
            >
              {config.label}
            </div>
            <div className="text-xs font-medium text-zinc-200">
              {advisor.name}
            </div>
          </div>
        </div>
      </div>

      <p className="font-serif text-xs italic leading-relaxed text-zinc-300">
        &ldquo;{advisor.advice}&rdquo;
      </p>

      <div className="mt-2 flex items-center justify-end">
        <span className={`text-xs ${config.textColor}`}>{advisor.bias}</span>
      </div>
    </div>
  );
}
