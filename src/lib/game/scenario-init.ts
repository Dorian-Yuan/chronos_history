import type { WorldState, ScenarioConfig } from "@/types";
import { getScenario } from "@/config";

export function initializeWorldState(scenarioId: string): WorldState | null {
  const scenario = getScenario(scenarioId);
  if (!scenario) return null;
  return { ...scenario.initialWorldState };
}

export function initializeGameFromScenario(scenarioId: string): {
  worldState: WorldState;
  scenario: ScenarioConfig;
} | null {
  const scenario = getScenario(scenarioId);
  if (!scenario) return null;

  const worldState: WorldState = {
    ...scenario.initialWorldState,
    deviations: [],
  };

  return { worldState, scenario };
}
