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
        className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-text-tertiary hover:border-accent-primary hover:text-accent-primary transition-colors"
      >
        <Upload size={16} />
        {t("scenario.import")}
      </button>
    </div>
  );
}
