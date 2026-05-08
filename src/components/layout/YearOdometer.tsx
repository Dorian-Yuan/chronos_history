import { useEffect, useState, useRef } from "react";
import { useTranslation } from "@/hooks/useTranslation";

interface YearOdometerProps {
  year: number;
}

export function YearOdometer({ year }: YearOdometerProps) {
  const { t } = useTranslation();
  const [displayYear, setDisplayYear] = useState(year);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevYearRef = useRef(year);

  useEffect(() => {
    if (year !== prevYearRef.current) {
      setIsAnimating(true);
      const diff = year - prevYearRef.current;
      const steps = Math.min(Math.abs(diff), 20);
      const stepTime = 300 / steps;
      let current = 0;

      const interval = setInterval(() => {
        current++;
        const progress = current / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayYear(Math.round(prevYearRef.current + diff * eased));
        if (current >= steps) {
          clearInterval(interval);
          setDisplayYear(year);
          setIsAnimating(false);
          prevYearRef.current = year;
        }
      }, stepTime);

      return () => clearInterval(interval);
    }
  }, [year]);

  const yearStr =
    displayYear < 0
      ? `${Math.abs(displayYear)} ${t("game.yearBC")}`
      : `${displayYear}`;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-text-tertiary">{t("game.yearFormat")}</span>
      <span
        className={`font-mono text-xl font-bold tabular-nums tracking-wider ${
          isAnimating ? "text-accent-primary" : "text-text-primary"
        } transition-colors duration-300`}
      >
        {yearStr}
      </span>
    </div>
  );
}
