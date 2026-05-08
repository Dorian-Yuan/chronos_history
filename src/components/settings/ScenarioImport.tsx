import { useRef } from "react";
import { Upload } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { registerScenario } from "@/config";
import type { ScenarioConfig } from "@/types";

export function ScenarioImport() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const scenario = JSON.parse(text) as ScenarioConfig;

      if (!scenario.id || !scenario.name || !scenario.initialWorldState) {
        alert("Invalid scenario format");
        return;
      }

      registerScenario(scenario);
      alert(`Scenario "${scenario.name}" imported successfully`);
    } catch {
      alert("Failed to import scenario");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="touch-target flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-text-tertiary transition-all hover:border-accent-primary/50 hover:bg-accent-primary/5 hover:text-accent-primary active:scale-[0.98]"
      >
        <Upload size={16} />
        {t("scenario.import")}
      </button>
    </div>
  );
}
