import { useState, useMemo } from "react";
import type {
  AdvisorData,
  AdvisorRole,
  ScenarioData,
  GameStats,
  CounselMessage,
  GameUniverse,
} from "@/types";
import { useGameState, useGameDispatch } from "@/lib/game";
import { AdvisorCard } from "./AdvisorCard";
import { CounselDialog } from "./CounselDialog";
import { getTerminology } from "@/config/terminology";

const REQUIRED_ROLES: AdvisorRole[] = [
  "General",
  "Diplomat",
  "Intel",
  "Scholar",
  "Merchant",
];

interface CabinetPanelProps {
  advisors: AdvisorData[];
  scenario: ScenarioData | null;
  stats: GameStats;
  historyLog: string[];
  currentSituation: string;
  universe?: GameUniverse;
}

export function CabinetPanel({
  advisors,
  scenario,
  stats,
  historyLog,
  currentSituation,
  universe = "history",
}: CabinetPanelProps) {
  const [counselAdvisor, setCounselAdvisor] = useState<AdvisorData | null>(
    null,
  );
  const gameState = useGameState();
  const dispatch = useGameDispatch();
  const term = useMemo(() => getTerminology(universe), [universe]);

  const getCounselMessages = (role: AdvisorRole): CounselMessage[] => {
    const session = (gameState.counselSessions ?? []).find(
      (s) => s.advisorRole === role,
    );
    return session?.messages ?? [];
  };

  const updateCounselMessages = (
    role: AdvisorRole,
    messages: CounselMessage[],
  ) => {
    dispatch({
      type: "UPDATE_COUNSEL_SESSION",
      session: { advisorRole: role, messages },
    });
  };

  if (!advisors.length) {
    return (
      <div className="flex flex-col gap-4 px-5 py-2">
        <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
          <p className="text-xs font-serif">暂无{term.cabinetLabel}信息</p>
          <p className="text-xs mt-1 text-text-tertiary/60 font-serif">
            完成第一回合后将显示{term.cabinetLabel}建议
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-2">
      <div className="flex flex-col gap-4">
        {REQUIRED_ROLES.map((role) => {
          const advisor = advisors.find((a) => a.role === role);
          if (!advisor) {
            return (
              <div
                key={role}
                className="rounded-lg border border-border bg-bg-card p-5 opacity-40"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-sm text-text-tertiary">
                    {term.advisorRoles[role]}
                  </span>
                </div>
                <p className="mt-3 text-xs font-serif text-text-tertiary">
                  {term.advisorVacantHint}
                </p>
              </div>
            );
          }
          const isActive = !advisor.status || advisor.status === "active";
          return (
            <AdvisorCard
              key={role}
              advisor={advisor}
              onCounsel={
                scenario && isActive ? (a) => setCounselAdvisor(a) : undefined
              }
              universe={universe}
            />
          );
        })}
      </div>

      {counselAdvisor && scenario && (
        <CounselDialog
          advisor={counselAdvisor}
          scenario={scenario}
          stats={stats}
          historyLog={historyLog}
          currentSituation={currentSituation}
          initialMessages={getCounselMessages(counselAdvisor.role)}
          onMessagesChange={(messages) =>
            updateCounselMessages(counselAdvisor.role, messages)
          }
          onClose={() => setCounselAdvisor(null)}
          universe={universe}
        />
      )}
    </div>
  );
}
