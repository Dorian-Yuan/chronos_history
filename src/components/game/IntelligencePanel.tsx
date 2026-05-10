import type { FactionData } from "@/types";
import { Swords, Skull, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface IntelligencePanelProps {
  factions: FactionData[];
}

const ATTITUDE_STYLES: Record<string, string> = {
  敌对: "bg-status-error-bg text-status-error-text border border-status-error-border",
  求和: "bg-status-info-bg text-status-info-text border border-status-info-border",
  中立: "bg-bg-tertiary text-text-secondary",
  友好: "bg-status-success-bg text-status-success-text border border-status-success-border",
  臣服: "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
  已灭亡: "bg-bg-tertiary text-text-tertiary line-through",
};

function getAttitudeStyle(attitude: string): string {
  return ATTITUDE_STYLES[attitude] || "bg-bg-tertiary text-text-secondary";
}

export function IntelligencePanel({ factions }: IntelligencePanelProps) {
  if (!factions.length) {
    return (
      <section className="flex flex-col gap-4 px-5 py-4" aria-label="情报面板">
        <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
          <p className="text-xs font-serif">暂无情报信息</p>
          <p className="text-xs mt-1 text-text-tertiary/60 font-serif">
            完成第一回合后将显示派系情报
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4 px-5 py-4" aria-label="情报面板">
      <ul className="flex flex-col gap-4">
        {factions.map((faction, idx) => (
          <li
            key={`${faction.name}-${idx}`}
            className={`rounded-lg border border-border bg-bg-secondary p-4 transition-all ${
              faction.is_destroyed ? "opacity-40" : ""
            } ${faction.is_new ? "ring-1 ring-accent-primary/30" : ""}`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {faction.is_destroyed ? (
                  <Skull size={14} className="text-text-tertiary" aria-hidden="true" />
                ) : (
                  <Swords size={14} className="text-text-tertiary" aria-hidden="true" />
                )}
                <span className="text-base font-serif font-bold text-text-primary">
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

            <p className="font-serif italic text-sm text-text-secondary leading-relaxed mb-3">
              {faction.description}
            </p>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <TrendingUp size={13} className="shrink-0 text-accent-primary" aria-hidden="true" />
                <span className="text-sm font-semibold text-accent-primary shrink-0">优势：</span>
                <span className="text-sm font-serif text-text-secondary">{faction.strength}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="shrink-0 text-accent-secondary" aria-hidden="true" />
                <span className="text-sm font-semibold text-accent-secondary shrink-0">弱点：</span>
                <span className="text-sm font-serif text-text-secondary">{faction.weakness}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={13} className="shrink-0 text-accent-danger" aria-hidden="true" />
                <span className="text-sm font-semibold text-accent-danger shrink-0">急需：</span>
                <span className="text-sm font-serif text-accent-danger">{faction.needs}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
