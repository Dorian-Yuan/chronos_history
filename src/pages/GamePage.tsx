import { useEffect } from "react";
import {
  useUIStore,
  useWorldStateStore,
  useChatStore,
  useSessionStore,
} from "@/stores";
import { ChatPanel } from "@/components/game";
import {
  WorldStatePanel,
  TimelineRuler,
  ChaosHistoryChart,
} from "@/components/stats";
import { scheduleAutoSave, cancelAutoSave } from "@/lib/db";
import type { SimulationSession } from "@/types";

function buildCurrentSession(): SimulationSession | null {
  const { worldState, historyPoints } = useWorldStateStore.getState();
  const { messages } = useChatStore.getState();
  const { currentSessionId, sessions } = useSessionStore.getState();
  const metadata = sessions.find((s) => s.id === currentSessionId);
  if (!metadata) return null;
  return {
    metadata,
    messages,
    worldState,
    historyPoints,
    suggestedActions: [],
    backgroundImage: null,
    causalChain: [],
    characterRelations: [],
  };
}

export function GamePage() {
  const activeTab = useUIStore((s) => s.activeTab);
  const isMobile = useUIStore((s) => s.isMobile);

  useEffect(() => {
    const unsubWorldState = useWorldStateStore.subscribe(() => {
      const session = buildCurrentSession();
      if (session) scheduleAutoSave(() => session);
    });

    const unsubMessages = useChatStore.subscribe(() => {
      const session = buildCurrentSession();
      if (session) scheduleAutoSave(() => session);
    });

    return () => {
      unsubWorldState();
      unsubMessages();
      cancelAutoSave();
    };
  }, []);

  if (isMobile) {
    return (
      <div className="h-full">
        {activeTab === "game" && <ChatPanel />}
        {activeTab === "state" && <WorldStatePanel />}
        {activeTab === "timeline" && (
          <div className="h-full overflow-auto">
            <TimelineRuler />
            <ChaosHistoryChart />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
      <div className="w-80 border-l border-border overflow-auto">
        <WorldStatePanel />
        <TimelineRuler />
        <ChaosHistoryChart />
      </div>
    </div>
  );
}
