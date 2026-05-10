import type { FactionData } from "@/types";
import { Swords, Skull, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface IntelligencePanelProps {
  factions: FactionData[];
}

const ATTITUDE_STYLES: Record<string, string> = {
  敌对: "bg-red-900/30 text-red-400",
  求和: "bg-blue-900/30 text-blue-400",
  中立: "bg-[#2A2A2E] text-zinc-300",
  友好: "bg-green-900/30 text-green-400",
  臣服: "bg-amber-900/30 text-amber-400",
  已灭亡: "bg-[#2A2A2E] text-zinc-500 line-through",
};

function getAttitudeStyle(attitude: string): string {
  return ATTITUDE_STYLES[attitude] || "bg-[#2A2A2E] text-zinc-300";
}

export function IntelligencePanel({ factions }: IntelligencePanelProps) {
  if (!factions.length) {
    return (
      <section className="flex flex-col gap-4 p-6" aria-label="情报面板">
        <div className="text-center text-xs uppercase tracking-[0.25em] text-[#666666] pt-4">
          GEOPOLITICAL INTELLIGENCE
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-[#666666]">
          <p className="text-xs">暂无情报信息</p>
          <p className="text-[10px] mt-1 text-[#666666]/60">
            完成第一回合后将显示派系情报
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 px-5 py-4" aria-label="情报面板">
      <div className="text-center text-xs uppercase tracking-[0.25em] text-[#666666] pt-4">
        GEOPOLITICAL INTELLIGENCE
      </div>
      <ul className="flex flex-col gap-4">
        {factions.map((faction, idx) => (
          <li
            key={`${faction.name}-${idx}`}
            className={`rounded-lg border border-[#2A2A2E] bg-[#141418] p-5 transition-all ${
              faction.is_destroyed ? "opacity-40" : ""
            } ${faction.is_new ? "ring-1 ring-[#2ECE8B]/30" : ""}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {faction.is_destroyed ? (
                  <Skull size={14} className="text-[#666666]" aria-hidden="true" />
                ) : (
                  <Swords size={14} className="text-[#666666]" aria-hidden="true" />
                )}
                <span className="text-lg font-bold text-text-primary">
                  {faction.name}
                </span>
              </div>
              <span className={`badge ${getAttitudeStyle(faction.attitude)} text-xs`}>
                {faction.attitude}
              </span>
            </div>

            {faction.is_new && (
              <div className="mb-2 text-xs font-semibold text-[#2ECE8B]">
                ● 新势力出现
              </div>
            )}

            <p className="italic text-sm text-[#CCCCCC] leading-[1.7] mb-4">
              {faction.description}
            </p>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <TrendingUp size={14} className="mt-0.5 shrink-0 text-[#2ECE8B]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#2ECE8B] shrink-0">优势：</span>
                <span className="text-sm text-[#CCCCCC]">{faction.strength}</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#E8833A]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#E8833A] shrink-0">弱点：</span>
                <span className="text-sm text-[#CCCCCC]">{faction.weakness}</span>
              </div>
              <div className="flex items-start gap-2">
                <Target size={14} className="mt-0.5 shrink-0 text-[#E85A5A]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#E85A5A] shrink-0">急需：</span>
                <span className="text-sm text-[#E85A5A]">{faction.needs}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
