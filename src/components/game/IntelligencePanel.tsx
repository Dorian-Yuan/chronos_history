import type { FactionData } from "@/types";
import { Swords, Skull, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface IntelligencePanelProps {
  factions: FactionData[];
}

const ATTITUDE_STYLES: Record<string, string> = {
  敌对: "bg-status-error-bg text-status-error-text border border-status-error-border",
  求和: "bg-status-info-bg text-status-info-text border border-status-info-border",
  中立: "bg-bg-tertiary text-text-secondary border border-border",
  友好: "bg-status-success-bg text-status-success-text border border-status-success-border",
  臣服: "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
  已灭亡: "bg-bg-tertiary text-text-tertiary line-through border border-border",
};

const ATTITUDE_FALLBACK_MAP: Record<string, string> = {
  即将归附: "友好",
  倾向臣服: "友好",
  即将臣服: "友好",
  表面臣服: "臣服",
  归附: "臣服",
  归顺: "臣服",
  降服: "臣服",
  倾向敌对: "敌对",
  敌视: "敌对",
  仇恨: "敌对",
  敌意: "敌对",
  亲近: "友好",
  友善: "友好",
  亲善: "友好",
  和平: "求和",
  议和: "求和",
  示好: "求和",
  冷淡: "中立",
  疏远: "中立",
  观望: "中立",
};

function getAttitudeStyle(attitude: string): string {
  if (ATTITUDE_STYLES[attitude]) return ATTITUDE_STYLES[attitude];
  const normalized = ATTITUDE_FALLBACK_MAP[attitude];
  if (normalized && ATTITUDE_STYLES[normalized])
    return ATTITUDE_STYLES[normalized];
  for (const key of Object.keys(ATTITUDE_STYLES)) {
    if (attitude.includes(key)) return ATTITUDE_STYLES[key];
  }
  return "bg-bg-tertiary text-text-secondary";
}

export function IntelligencePanel({ factions }: IntelligencePanelProps) {
  if (!factions.length) {
    return (
      <section className="flex flex-col gap-4 px-5 py-2" aria-label="情报面板">
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
    <section className="flex flex-col gap-4 px-5 py-2" aria-label="情报面板">
      <ul className="flex flex-col gap-4">
        {factions.map((faction, idx) => (
          <li
            key={`${faction.name}-${idx}`}
            className={`rounded-lg border border-border bg-bg-card p-5 transition-all ${
              faction.is_destroyed ? "opacity-40" : ""
            } ${faction.is_new ? "ring-1 ring-accent-primary/30" : ""}`}
          >
            <div className="mb-2 flex items-center justify-between">
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
                <span className="text-base font-serif font-bold text-text-primary">
                  {faction.name}
                </span>
                {faction.leader && (
                  <span className="text-sm font-serif text-text-secondary">
                    // {faction.leader}
                  </span>
                )}
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
                <TrendingUp
                  size={13}
                  className="shrink-0 text-accent-primary"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-accent-primary shrink-0">
                  优势：
                </span>
                <span className="text-sm font-serif text-text-secondary">
                  {faction.strength}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={13}
                  className="shrink-0 text-accent-secondary"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-accent-secondary shrink-0">
                  弱点：
                </span>
                <span className="text-sm font-serif text-text-secondary">
                  {faction.weakness}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target
                  size={13}
                  className="shrink-0 text-accent-danger"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-accent-danger shrink-0">
                  急需：
                </span>
                <span className="text-sm font-serif text-accent-danger">
                  {faction.needs}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
