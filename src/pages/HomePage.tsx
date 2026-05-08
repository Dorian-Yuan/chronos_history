import { useNavigate } from "react-router-dom";
import { ScenarioSelect } from "@/components/settings";
import { useSessionStore, useWorldStateStore, useChatStore } from "@/stores";
import { initializeGameFromScenario } from "@/lib/game";
import { saveFullSession } from "@/lib/db";

export function HomePage() {
  const navigate = useNavigate();
  const addSession = useSessionStore((s) => s.addSession);
  const setCurrentSessionId = useSessionStore((s) => s.setCurrentSessionId);

  const handleSelectScenario = async (scenarioId: string) => {
    const result = initializeGameFromScenario(scenarioId);
    if (!result) return;

    const { worldState, scenario } = result;
    const sessionId = `session_${Date.now()}`;

    useWorldStateStore.getState().setWorldState(worldState);
    useChatStore.getState().clearMessages();

    const metadata = {
      id: sessionId,
      title: scenario.name,
      lastUpdated: Date.now(),
      year: worldState.year,
      scenarioId,
    };

    addSession(metadata);
    setCurrentSessionId(sessionId);

    try {
      await saveFullSession({
        metadata,
        messages: [],
        worldState,
        historyPoints: [
          { year: worldState.year, chaos: worldState.chaosLevel },
        ],
        suggestedActions: [],
        backgroundImage: null,
        causalChain: [],
        characterRelations: [],
      });
    } catch (e) {
      console.warn("Failed to save session:", e);
    }

    navigate(`/game/${scenarioId}`);
  };

  return <ScenarioSelect onSelectScenario={handleSelectScenario} />;
}
