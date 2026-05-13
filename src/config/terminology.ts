import type { GameUniverse } from "@/types";
import { HISTORY_TERMINOLOGY } from "./history-terminology";
import { LIFE_TERMINOLOGY } from "./life-terminology";

export function getTerminology(universe: GameUniverse) {
  return universe === "life" ? LIFE_TERMINOLOGY : HISTORY_TERMINOLOGY;
}

export { HISTORY_TERMINOLOGY, LIFE_TERMINOLOGY };
