import type { FactionData } from "@/types";
import { Swords, Skull, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface IntelligencePanelProps {
  factions: FactionData[];
}

const ATTITUDE_STYLES: Record<string, string> = {
  "\u654C\u5BF9": "bg-red-900/20 text-red-400",
  "\u6C42\u548C": "bg-blue-900/20 text-blue-400",
  "\u4E2D\u7ACB": "bg-[#2A2A2E] text-zinc-300",
  "\u53CB\u597D": "bg-green-900/20 text-green-400",
  "\u81E3\u670D": "bg-amber-900/20 text-amber-400",
  "\u5DF2\u706D\u4EA1": "bg-[#2A2A2E] text-zinc-500 line-through",
};

function getAttitudeStyle(attitude: string): string {
  return (
    ATTITUDE_STYLES[attitude] ||
    "bg-[#2A2A2E] text-zinc-300"
  );
}

export function IntelligencePanel({ factions }: IntelligencePanelProps) {
  if (!factions.length) {
    return (
      <section className="flex flex-col gap-4 p-6" aria-label="\u60C5\u62A5\u9762\u677F">
        <div className="text-center text-xs uppercase tracking-[0.25em] text-[#666666]">
          GEOPOLITICAL INTELLIGENCE
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-[#666666]">
          <p className="text-xs">\u6682\u65E0\u60C5\u62A5\u4FE1\u606F</p>
          <p className="text-[10px] mt-1 text-[#666666]/60">
            \u5B8C\u6210\u7B2C\u4E00\u56DE\u5408\u540E\u5C06\u663E\u793A\u6D3E\u7CFB\u60C5\u62A5
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 p-6" aria-label="\u60C5\u62A5\u9762\u677F">
      <div className="text-center text-xs uppercase tracking-[0.25em] text-[#666666]">
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
                <span className="text-[22px] font-bold text-text-primary">
                  {faction.name}
                </span>
              </div>
              <span className={`badge ${getAttitudeStyle(faction.attitude)} text-xs`}>
                {faction.attitude}
              </span>
            </div>

            {faction.is_new && (
              <div className="mb-2 text-xs font-semibold text-[#2ECE8B]">
                \u25CF \u65B0\u52BF\u529B\u51FA\u73B0
              </div>
            )}

            <p className="italic text-base text-[#CCCCCC] leading-[1.7] mb-4">
              {faction.description}
            </p>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2">
                <TrendingUp size={14} className="mt-0.5 shrink-0 text-[#2ECE8B]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#2ECE8B] shrink-0">\u4F18\u52BF\uFF1A</span>
                <span className="text-sm text-[#CCCCCC]">{faction.strength}</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#E8833A]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#E8833A] shrink-0">\u5F31\u70B9\uFF1A</span>
                <span className="text-sm text-[#CCCCCC]">{faction.weakness}</span>
              </div>
              <div className="flex items-start gap-2">
                <Target size={14} className="mt-0.5 shrink-0 text-[#E85A5A]" aria-hidden="true" />
                <span className="text-sm font-semibold text-[#E85A5A] shrink-0">\u6025\u9700\uFF1A</span>
                <span className="text-sm text-[#E85A5A]">{faction.needs}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
