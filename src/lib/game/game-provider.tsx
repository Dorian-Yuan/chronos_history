import { useReducer, type ReactNode } from "react";
import { gameReducer } from "./game-reducer";
import { INITIAL_GAME_STATE } from "@/types";
import { GameContext } from "./game-hooks";

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
