import { useState } from "react";
import type { AdvisorData, ScenarioData, GameStats } from "@/types";
import { AdvisorCard } from "./AdvisorCard";
import { CounselDialog } from "./CounselDialog";

interface CabinetPanelProps {
  advisors: AdvisorData[];
  scenario: ScenarioData | null;
  stats: GameStats;
  historyLog: string[];
  currentSituation: string;
}

export function CabinetPanel({ advisors, scenario, stats, historyLog, currentSituation }: CabinetPanelProps) {
  const [counselAdvisor, setCounselAdvisor] = useState<AdvisorData | null>(null);

  if (!advisors.length) {
    return (
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
          <p className="text-xs font-serif">暂无顾问信息</p>
          <p className="text-xs mt-1 text-text-tertiary/60 font-serif">
            完成第一回合后将显示顾问建议
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 py-4">
      <div className="flex flex-col gap-4">
        {advisors.map((advisor) => (
          <AdvisorCard
            key={advisor.role}
            advisor={advisor}
            onCounsel={scenario ? (a) => setCounselAdvisor(a) : undefined}
          />
        ))}
      </div>

      {counselAdvisor && scenario && (
        <CounselDialog
          advisor={counselAdvisor}
          scenario={scenario}
          stats={stats}
          historyLog={historyLog}
          currentSituation={currentSituation}
          onClose={() => setCounselAdvisor(null)}
        />
      )}
    </div>
  );
}
