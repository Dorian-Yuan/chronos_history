import type { AdvisorData } from "@/types";
import { AdvisorCard } from "./AdvisorCard";

interface CabinetPanelProps {
  advisors: AdvisorData[];
}

export function CabinetPanel({ advisors }: CabinetPanelProps) {
  if (!advisors.length) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="text-center text-xs uppercase tracking-[0.25em] text-[#666666]">
          TOP SECRET // ADVISORY
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-[#666666]">
          <p className="text-xs">\u6682\u65E0\u987E\u95EE\u4FE1\u606F</p>
          <p className="text-[10px] mt-1 text-[#666666]/60">
            \u5B8C\u6210\u7B2C\u4E00\u56DE\u5408\u540E\u5C06\u663E\u793A\u987E\u95EE\u5EFA\u8BAE
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="text-center text-xs uppercase tracking-[0.25em] text-[#666666]">
        TOP SECRET // ADVISORY
      </div>
      <div className="flex flex-col gap-4">
        {advisors.map((advisor) => (
          <AdvisorCard key={advisor.role} advisor={advisor} />
        ))}
      </div>
    </div>
  );
}
