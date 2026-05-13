import { useMemo } from "react";
import type { FactionData, GameUniverse } from "@/types";
import { getTerminology } from "@/config/terminology";
import {
  Swords,
  Skull,
  TrendingUp,
  AlertTriangle,
  Target,
  Crown,
} from "lucide-react";

interface SuperiorInfo {
  title: string;
  name: string;
}

interface IntelligencePanelProps {
  factions: FactionData[];
  universe?: GameUniverse;
  superior?: SuperiorInfo;
  favor?: number;
}

const ATTITUDE_STYLE_MAP: Record<string, string> = {
  hostile:
    "bg-status-error-bg text-status-error-text border border-status-error-border",
  peace:
    "bg-status-info-bg text-status-info-text border border-status-info-border",
  neutral: "bg-bg-tertiary text-text-secondary border border-border",
  friendly:
    "bg-status-success-bg text-status-success-text border border-status-success-border",
  vassal:
    "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
  destroyed:
    "bg-bg-tertiary text-text-tertiary line-through border border-border",
};

const SUPERIOR_ATTITUDE_STYLES: Record<string, string> = {
  trust:
    "bg-status-success-bg text-status-success-text border border-status-success-border",
  normal:
    "bg-status-info-bg text-status-info-text border border-status-info-border",
  wary: "bg-status-warning-bg text-status-warning-text border border-status-warning-border",
  danger:
    "bg-status-error-bg text-status-error-text border border-status-error-border",
  fatal:
    "bg-accent-danger/20 text-accent-danger border border-accent-danger/40",
};

function getAttitudeStyle(
  attitude: string,
  fallbackMap: Record<string, string>,
  attitudeLabels: Record<string, string>,
): string {
  for (const [engKey, cnLabel] of Object.entries(attitudeLabels)) {
    if (attitude === cnLabel && ATTITUDE_STYLE_MAP[engKey]) {
      return ATTITUDE_STYLE_MAP[engKey];
    }
  }
  const fallbackKey = fallbackMap[attitude];
  if (fallbackKey && ATTITUDE_STYLE_MAP[fallbackKey]) {
    return ATTITUDE_STYLE_MAP[fallbackKey];
  }
  for (const [engKey, cnLabel] of Object.entries(attitudeLabels)) {
    if (attitude.includes(cnLabel) && ATTITUDE_STYLE_MAP[engKey]) {
      return ATTITUDE_STYLE_MAP[engKey];
    }
  }
  return "bg-bg-tertiary text-text-secondary";
}

function getSuperiorAttitudeKey(favor: number): string {
  if (favor > 70) return "trust";
  if (favor > 50) return "normal";
  if (favor > 30) return "wary";
  if (favor > 15) return "danger";
  return "fatal";
}

export function IntelligencePanel({
  factions,
  universe = "history",
  superior,
  favor,
}: IntelligencePanelProps) {
  const term = useMemo(() => getTerminology(universe), [universe]);

  const showSuperior = universe === "life" && superior;

  if (!factions.length && !showSuperior) {
    return (
      <section
        className="flex flex-col gap-4 px-5 py-2"
        aria-label={`${term.intelligenceLabel}面板`}
      >
        <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
          <p className="text-xs font-serif">暂无{term.intelligenceLabel}信息</p>
          <p className="text-xs mt-1 text-text-tertiary/60 font-serif">
            完成第一回合后将显示派系{term.intelligenceLabel}
          </p>
        </div>
      </section>
    );
  }

  const superiorAttitudeKey =
    showSuperior && favor !== undefined
      ? getSuperiorAttitudeKey(favor)
      : "normal";
  const superiorAttitudeLabels = (term as Record<string, unknown>)
    .superiorAttitudeLabels as Record<string, string> | undefined;
  const superiorAttitudeText =
    superiorAttitudeLabels?.[superiorAttitudeKey] || "正常看待";
  const superiorAttitudeStyle =
    SUPERIOR_ATTITUDE_STYLES[superiorAttitudeKey] ||
    SUPERIOR_ATTITUDE_STYLES.normal;

  return (
    <section
      className="flex flex-col gap-4 px-5 py-2"
      aria-label={`${term.intelligenceLabel}面板`}
    >
      {showSuperior && (
        <div className="rounded-lg border border-accent-secondary/30 bg-accent-secondary/5 p-5 ring-1 ring-accent-secondary/10">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Crown
                size={14}
                className="text-accent-secondary"
                aria-hidden="true"
              />
              <span className="text-base font-serif font-bold text-text-primary">
                {((term as Record<string, unknown>).superiorLabel as string) ||
                  "上位者"}
              </span>
              <span className="text-sm font-serif text-accent-secondary font-semibold">
                {superior.title} {superior.name}
              </span>
            </div>
            <span className={`badge ${superiorAttitudeStyle}`}>
              {superiorAttitudeText}
            </span>
          </div>
          {favor !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-text-secondary">
                  {term.statLabels.international_standing}
                </span>
                <span className="font-mono text-xs font-semibold text-text-primary">
                  {favor}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-sm bg-bg-tertiary"
                role="progressbar"
                aria-valuenow={favor}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`圣眷: ${favor}`}
              >
                <div
                  className="h-full rounded-sm transition-all duration-700"
                  style={{
                    width: `${favor}%`,
                    backgroundColor:
                      favor > 70
                        ? "var(--color-accent-primary)"
                        : favor > 50
                          ? "var(--color-accent-secondary)"
                          : favor > 30
                            ? "var(--color-accent-secondary)"
                            : "var(--color-accent-danger)",
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
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
                    {faction.leader_status &&
                      faction.leader_status !== "active" && (
                        <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded bg-accent-danger/10 text-accent-danger font-serif">
                          {term.leaderStatusLabels[faction.leader_status] ||
                            faction.leader_status}
                        </span>
                      )}
                  </span>
                )}
              </div>
              <span
                className={`badge ${getAttitudeStyle(faction.attitude, term.attitudeFallbackMap, term.attitudeLabels)}`}
              >
                {faction.attitude}
              </span>
            </div>

            {faction.is_new && (
              <div className="mb-2 text-xs font-semibold text-accent-primary">
                {term.factionNewLabel}
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
                  {term.factionStrengthLabel}
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
                  {term.factionWeaknessLabel}
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
                  {term.factionNeedsLabel}
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
