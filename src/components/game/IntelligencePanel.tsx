import type { FactionData } from "@/types";
import { Swords, ShieldAlert, Flame, Skull } from "lucide-react";

interface IntelligencePanelProps {
  factions: FactionData[];
}

const ATTITUDE_STYLES: Record<string, string> = {
  敌对: "bg-red-900/20 text-red-400 border-red-800/20",
  求和: "bg-blue-900/20 text-blue-400 border-blue-800/20",
  中立: "bg-zinc-800/30 text-zinc-300 border-zinc-700/20",
  友好: "bg-green-900/20 text-green-400 border-green-800/20",
  臣服: "bg-amber-900/20 text-amber-400 border-amber-800/20",
  已灭亡: "bg-zinc-800/40 text-zinc-500 line-through border-zinc-700/20",
};

function getAttitudeStyle(attitude: string): string {
  return (
    ATTITUDE_STYLES[attitude] ||
    "bg-zinc-800/30 text-zinc-300 border-zinc-700/20"
  );
}

export function IntelligencePanel({ factions }: IntelligencePanelProps) {
  if (!factions.length) return null;

  return (
    <section className="flex flex-col gap-4 p-5" aria-label="情报面板">
      <div className="section-label">情报</div>
      <ul className="flex flex-col gap-4">
        {factions.map((faction, idx) => (
          <li
            key={`${faction.name}-${idx}`}
            className={`rounded-lg border border-border bg-bg-card px-5 py-5 transition-all ${
              faction.is_destroyed ? "opacity-40" : ""
            } ${faction.is_new ? "ring-1 ring-accent-primary/30" : ""}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {faction.is_destroyed ? (
                  <Skull
                    size={14}
                    className="text-text-tertiary"
                    aria-hidden="true"
                  />
                ) : (
                  <Swords
                    size={14}
                    className="text-text-tertiary"
                    aria-hidden="true"
                  />
                )}
                <span className="text-sm font-semibold text-text-primary">
                  {faction.name}
                </span>
              </div>
              <span className={`badge ${getAttitudeStyle(faction.attitude)}`}>
                {faction.attitude}
              </span>
            </div>

            {faction.is_new && (
              <div className="mb-2 text-xs font-semibold text-accent-primary">
                ● 新势力出现
              </div>
            )}

            <p className="font-serif text-xs italic leading-relaxed text-text-secondary mb-4">
              {faction.description}
            </p>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-xs">
                <Flame
                  size={11}
                  className="mt-0.5 shrink-0 text-green-500"
                  aria-hidden="true"
                />
                <span className="text-text-tertiary shrink-0">优势：</span>
                <span className="text-text-secondary">{faction.strength}</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <ShieldAlert
                  size={11}
                  className="mt-0.5 shrink-0 text-red-400"
                  aria-hidden="true"
                />
                <span className="text-text-tertiary shrink-0">弱点：</span>
                <span className="text-text-secondary">{faction.weakness}</span>
              </div>
              <div className="flex items-start gap-2 text-xs">
                <Swords
                  size={11}
                  className="mt-0.5 shrink-0 text-amber-400"
                  aria-hidden="true"
                />
                <span className="text-text-tertiary shrink-0">急需：</span>
                <span className="text-text-secondary">{faction.needs}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
