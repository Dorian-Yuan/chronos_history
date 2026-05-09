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
  }
> = {
  General: {
    label: "\u5C06\u519B",
    icon: Shield,
  },
  Diplomat: {
    label: "\u5916\u4EA4\u5B98",
    icon: Scroll,
  },
  Intel: {
    label: "\u5BC6\u63A2",
    icon: Eye,
  },
  Scholar: {
    label: "\u5B66\u8005",
    icon: BookOpen,
  },
  Merchant: {
    label: "\u5546\u4EBA",
    icon: Coins,
  },
};

export function AdvisorCard({ advisor }: AdvisorCardProps) {
  const config = ROLE_CONFIG[advisor.role];
  const [showMotive, setShowMotive] = useState(false);
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="rounded-lg border border-[#2A2A2E] bg-[#141418] p-5 transition-all hover:border-[#3A3A3E]">
      <div className="flex items-center gap-2.5">
        <Icon size={16} className="text-[#666666]" aria-hidden="true" />
        <span className="text-sm text-[#CCCCCC]">
          {config.label} // {advisor.name}
        </span>
      </div>

      <p className="mt-3 text-[17px] text-white font-medium leading-[1.8]">
        &ldquo;{advisor.advice}&rdquo;
      </p>

      <div className="mt-3 text-[13px] text-[#666666]">
        \u503E\u5411\uFF1A{advisor.bias}
      </div>

      {advisor.hidden_motive && (
        <div className="mt-3">
          <button
            onClick={() => setShowMotive(!showMotive)}
            className="text-[11px] text-[#666666] hover:text-[#CCCCCC] transition-colors"
            aria-label={showMotive ? "\u9690\u85CF\u79D8\u5BC6\u52A8\u673A" : "\u67E5\u770B\u79D8\u5BC6\u52A8\u673A"}
          >
            {showMotive ? "\u25B2 \u9690\u85CF\u52A8\u673A" : "\u25BC \u79D8\u5BC6\u52A8\u673A"}
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
