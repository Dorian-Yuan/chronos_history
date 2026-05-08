import type { AdvisorData } from "@/types";
import { AdvisorCard } from "./AdvisorCard";

interface CabinetPanelProps {
  advisors: AdvisorData[];
}

export function CabinetPanel({ advisors }: CabinetPanelProps) {
  if (!advisors.length) return null;

  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="font-serif text-sm font-medium text-zinc-400 tracking-wider">
        内阁
      </h3>
      <div className="flex flex-col gap-2.5">
        {advisors.map((advisor) => (
          <AdvisorCard key={advisor.role} advisor={advisor} />
        ))}
      </div>
    </div>
  );
}
