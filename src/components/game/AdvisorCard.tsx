import { useMemo, useState } from "react";
import type {
  AdvisorData,
  AdvisorRole,
  AdvisorStatus,
  GameUniverse,
} from "@/types";
import { getTerminology } from "@/config/terminology";
import {
  Shield,
  Scroll,
  Eye,
  BookOpen,
  Coins,
  MessageCircle,
} from "lucide-react";

interface AdvisorCardProps {
  advisor: AdvisorData;
  onCounsel?: (advisor: AdvisorData) => void;
  universe?: GameUniverse;
}

const ROLE_STATIC: Record<
  AdvisorRole,
  {
    icon: typeof Shield;
    colorVar: string;
    bgColorVar: string;
    borderColorVar: string;
  }
> = {
  General: {
    icon: Shield,
    colorVar: "--color-role-general",
    bgColorVar: "--color-role-general-bg",
    borderColorVar: "--color-role-general-border",
  },
  Diplomat: {
    icon: Scroll,
    colorVar: "--color-role-diplomat",
    bgColorVar: "--color-role-diplomat-bg",
    borderColorVar: "--color-role-diplomat-border",
  },
  Intel: {
    icon: Eye,
    colorVar: "--color-role-intel",
    bgColorVar: "--color-role-intel-bg",
    borderColorVar: "--color-role-intel-border",
  },
  Scholar: {
    icon: BookOpen,
    colorVar: "--color-role-scholar",
    bgColorVar: "--color-role-scholar-bg",
    borderColorVar: "--color-role-scholar-border",
  },
  Merchant: {
    icon: Coins,
    colorVar: "--color-role-merchant",
    bgColorVar: "--color-role-merchant-bg",
    borderColorVar: "--color-role-merchant-border",
  },
};

export function AdvisorCard({
  advisor,
  onCounsel,
  universe = "history",
}: AdvisorCardProps) {
  const term = useMemo(() => getTerminology(universe), [universe]);

  const roleConfig = useMemo(() => {
    const cfg = {} as Record<
      AdvisorRole,
      {
        label: string;
        icon: typeof Shield;
        colorVar: string;
        bgColorVar: string;
        borderColorVar: string;
      }
    >;
    for (const role of Object.keys(ROLE_STATIC) as AdvisorRole[]) {
      cfg[role] = {
        ...ROLE_STATIC[role],
        label: term.advisorRoles[role],
      };
    }
    return cfg;
  }, [term]);

  const statusLabels = useMemo(
    () => term.advisorStatusLabels as Record<AdvisorStatus, string>,
    [term],
  );

  const config = roleConfig[advisor.role];
  const [showMotive, setShowMotive] = useState(false);
  if (!config) return null;

  const Icon = config.icon;
  const isActive = !advisor.status || advisor.status === "active";
  const statusLabel = advisor.status ? statusLabels[advisor.status] : "";

  const roleColor = `var(${config.colorVar})`;
  const roleBgColor = `var(${config.bgColorVar})`;
  const roleBorderColor = `var(${config.borderColorVar})`;

  return (
    <div
      className={`rounded-lg border bg-bg-card p-5 transition-all ${isActive ? "hover:border-border-hover" : "opacity-50"}`}
      style={{ borderColor: roleBorderColor }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: roleBgColor }}
        >
          <Icon size={14} style={{ color: roleColor }} aria-hidden="true" />
        </div>
        <span className="text-sm" style={{ color: roleColor }}>
          {config.label}
        </span>
        <span className="text-sm font-serif text-text-secondary">
          // {advisor.name}
        </span>
        {statusLabel && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-danger/10 text-accent-danger font-serif">
            {statusLabel}
          </span>
        )}
      </div>

      {isActive ? (
        <>
          <p className="mt-3 text-sm font-serif text-text-primary font-medium leading-relaxed">
            &ldquo;{advisor.advice}&rdquo;
          </p>

          <div className="mt-3">
            <div className="text-xs font-serif text-text-tertiary">
              {term.tendencyLabel}
              {advisor.bias}
            </div>
            <div className="mt-2 flex items-center justify-between">
              {onCounsel && isActive && (
                <button
                  onClick={() => onCounsel(advisor)}
                  className="flex items-center gap-1 text-xs font-serif text-accent-secondary/70 hover:text-accent-secondary transition-colors"
                  aria-label={`与${advisor.name}${term.counselLabel}`}
                >
                  <MessageCircle size={11} />
                  {term.counselLabel}
                </button>
              )}

              {advisor.hidden_motive && (
                <button
                  onClick={() => setShowMotive(!showMotive)}
                  className="flex items-center gap-1 text-xs font-serif text-text-tertiary hover:text-text-secondary transition-colors"
                  aria-label={
                    showMotive ? term.hiddenMotiveHide : term.hiddenMotiveShow
                  }
                >
                  {showMotive
                    ? `▲ ${term.hiddenMotiveHide}`
                    : `▼ ${term.hiddenMotiveShow}`}
                </button>
              )}
            </div>
          </div>

          {advisor.hidden_motive && showMotive && (
            <div className="mt-2 rounded-md border border-border bg-bg-card py-1.5 px-4">
              <p className="text-xs font-serif italic leading-tight text-accent-secondary">
                {advisor.hidden_motive}
              </p>
            </div>
          )}
        </>
      ) : (
        <p className="mt-3 text-xs font-serif text-text-tertiary italic">
          {term.advisorVacantHint}
        </p>
      )}
    </div>
  );
}
