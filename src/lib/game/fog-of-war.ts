import type { WorldState, FactionState } from "@/types";
import { getAppConfig } from "@/config";

export interface FogOfWarResult {
  visibleWorldState: WorldState;
  hiddenEvents: string[];
  revealedInfo: string[];
}

function getIntelligenceRegex(): RegExp | null {
  const appConfig = getAppConfig();
  if (!appConfig.intelligenceKeywords) return null;
  return new RegExp(appConfig.intelligenceKeywords, "i");
}

export function applyFogOfWar(
  worldState: WorldState,
  userInput: string,
  hiddenEvents: string[],
  revealedInfo: string[],
): FogOfWarResult {
  const regex = getIntelligenceRegex();
  const isIntelligenceAction = regex ? regex.test(userInput) : false;

  const visibleFactions: FactionState[] = worldState.factions.map((faction) => {
    if (faction.isRevealed) {
      return faction;
    }
    if (isIntelligenceAction) {
      return { ...faction, isRevealed: true };
    }
    return {
      ...faction,
      hiddenActions: [],
      isRevealed: false,
    };
  });

  const newRevealedInfo = [...revealedInfo];
  if (isIntelligenceAction) {
    for (const faction of worldState.factions) {
      if (!faction.isRevealed && faction.hiddenActions.length > 0) {
        newRevealedInfo.push(
          `${faction.name}: ${faction.hiddenActions.join(", ")}`,
        );
      }
    }
  }

  return {
    visibleWorldState: {
      ...worldState,
      factions: visibleFactions,
    },
    hiddenEvents,
    revealedInfo: newRevealedInfo,
  };
}

export function getUncertaintyLevel(worldState: WorldState): number {
  const unrevealedFactions = worldState.factions.filter((f) => !f.isRevealed);
  const totalFactions = worldState.factions.length;
  if (totalFactions === 0) return 0;
  return Math.round((unrevealedFactions.length / totalFactions) * 100);
}
