import { useContext, createContext } from "react";
import type { GameState } from "@/types";
import type { GameAction } from "./game-reducer";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGameState(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameState must be used within GameProvider");
  return ctx.state;
}

export function useGameDispatch(): React.Dispatch<GameAction> {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGameDispatch must be used within GameProvider");
  return ctx.dispatch;
}
