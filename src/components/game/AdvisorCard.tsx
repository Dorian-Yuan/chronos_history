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
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  General: {
    label: "将军",
    icon: Shield,
    color: "#E85A5A",
    bgColor: "rgba(232, 90, 90, 0.08)",
    borderColor: "rgba(232, 90, 90, 0.2)",
  },
  Diplomat: {
    label: "外交官",
    icon: Scroll,
    color: "#4A9EF5",
    bgColor: "rgba(74, 158, 245, 0.08)",
    borderColor: "rgba(74, 158, 245, 0.2)",
  },
  Intel: {
    label: "密探",
    icon: Eye,
    color: "#A78BFA",
    bgColor: "rgba(167, 139, 250, 0.08)",
    borderColor: "rgba(167, 139, 250, 0.2)",
  },
  Scholar: {
    label: "学者",
    icon: BookOpen,
    color: "#2ECE8B",
    bgColor: "rgba(46, 206, 139, 0.08)",
    borderColor: "rgba(46, 206, 139, 0.2)",
  },
  Merchant: {
    label: "商人",
    icon: Coins,
    color: "#E8833A",
    bgColor: "rgba(232, 131, 58, 0.08)",
    borderColor: "rgba(232, 131, 58, 0.2)",
  },
};

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const config = ROLE_CONFIG[advisor.role];
  const [showMotive, setShowMotive] = useState(false);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div
      className="rounded-lg border bg-[#141418] p-5 transition-all hover:border-[#3A3A3E]"
      style={{ borderColor: config.borderColor }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon size={14} style={{ color: config.color }} aria-hidden="true" />
        </div>
        <span className="text-sm" style={{ color: config.color }}>
          {config.label}
        </span>
        <span className="text-sm text-[#CCCCCC]">// {advisor.name}</span>
      </div>

      <p className="mt-3 text-[17px] text-white font-medium leading-[1.8]">
        &ldquo;{advisor.advice}&rdquo;
      </p>

      <div className="mt-3 text-[13px] text-[#666666]">
        倾向：{advisor.bias}
      </div>

      {advisor.hidden_motive && (
        <div className="mt-3">
          <button
            onClick={() => setShowMotive(!showMotive)}
            className="text-[11px] text-[#666666] hover:text-[#CCCCCC] transition-colors"
            aria-label={showMotive ? "隐藏秘密动机" : "查看秘密动机"}
          >
            {showMotive ? "▲ 隐藏动机" : "▼ 秘密动机"}
          </button>
        </div>
      )}

      {advisor.hidden_motive && showMotive && (
        <div className="mt-3 rounded border border-[#2A2A2E] bg-[#1A1A1E] px-4 py-3">
          <p className="text-[12px] italic leading-[1.7] text-[#E8833A]/80">
            {advisor.hidden_motive}
          </p>
        </div>
      )}
    </div>
  );
}
