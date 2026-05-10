import type { AdvisorData } from "@/types";
import { AdvisorCard } from "./AdvisorCard";

interface CabinetPanelProps {
  advisors: AdvisorData[];
}

export function CabinetPanel({ advisors }: CabinetPanelProps) {
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
          <AdvisorCard key={advisor.role} advisor={advisor} />
        ))}
      </div>
    </div>
  );
}
