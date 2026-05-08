import type { FactionData } from "@/types";
import { Swords, ShieldAlert, Flame, Skull } from "lucide-react";

interface IntelligencePanelProps {
  factions: FactionData[];
}

const ATTITUDE_STYLES: Record<string, string> = {
  敌对: "bg-red-900/30 text-red-400",
  求和: "bg-blue-900/30 text-blue-400",
  中立: "bg-zinc-700/30 text-zinc-300",
  友好: "bg-green-900/30 text-green-400",
  臣服: "bg-amber-900/30 text-amber-400",
  已灭亡: "bg-zinc-800/50 text-zinc-500 line-through",
};

function getAttitudeStyle(attitude: string): string {
  return ATTITUDE_STYLES[attitude] || "bg-zinc-700/30 text-zinc-300";
}

export function IntelligencePanel({ factions }: IntelligencePanelProps) {
  if (!factions.length) return null;

  return (
    <section className="flex flex-col gap-3 p-4" aria-label="情报面板">
      <h3 className="font-serif text-sm font-medium text-zinc-300 tracking-wider">
        情报
      </h3>
      <ul className="flex flex-col gap-2.5">
        {factions.map((faction, idx) => (
          <li
            key={`${faction.name}-${idx}`}
            className={`rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 transition-all ${
              faction.is_destroyed ? "opacity-40" : ""
            } ${faction.is_new ? "ring-1 ring-amber-500/30" : ""}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {faction.is_destroyed ? (
                  <Skull
                    size={13}
                    className="text-zinc-500"
                    aria-hidden="true"
                  />
                ) : (
                  <Swords
                    size={13}
                    className="text-zinc-400"
                    aria-hidden="true"
                  />
                )}
                <span className="text-sm font-medium text-zinc-200">
                  {faction.name}
                </span>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${getAttitudeStyle(faction.attitude)}`}
              >
                {faction.attitude}
              </span>
            </div>

            {faction.is_new && (
              <div className="mb-1.5 text-xs font-medium text-amber-400">
                ● 新势力出现
              </div>
            )}

            <p className="font-serif text-xs italic leading-relaxed text-zinc-300">
              {faction.description}
            </p>

            <div className="mt-2 space-y-1">
              <div className="flex items-start gap-1.5 text-xs">
                <Flame
                  size={10}
                  className="mt-0.5 shrink-0 text-green-500"
                  aria-hidden="true"
                />
                <span className="text-zinc-400">优势：</span>
                <span className="text-zinc-300">{faction.strength}</span>
              </div>
              <div className="flex items-start gap-1.5 text-xs">
                <ShieldAlert
                  size={10}
                  className="mt-0.5 shrink-0 text-red-400"
                  aria-hidden="true"
                />
                <span className="text-zinc-400">弱点：</span>
                <span className="text-zinc-300">{faction.weakness}</span>
              </div>
              <div className="flex items-start gap-1.5 text-xs">
                <Swords
                  size={10}
                  className="mt-0.5 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <span className="text-zinc-400">急需：</span>
                <span className="text-zinc-300">{faction.needs}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
