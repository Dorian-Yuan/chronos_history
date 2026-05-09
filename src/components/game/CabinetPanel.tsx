import type { AdvisorData } from "@/types";
import { AdvisorCard } from "./AdvisorCard";

interface CabinetPanelProps {
  advisors: AdvisorData[];
}

export function CabinetPanel({ advisors }: CabinetPanelProps) {
  if (!advisors.length) return null;

  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="section-label">内阁</div>
      <div className="flex flex-col gap-4">
        {advisors.map((advisor) => (
          <AdvisorCard key={advisor.role} advisor={advisor} />
        ))}
      </div>
    </div>
  );
}
