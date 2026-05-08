import { getDB } from "./schema";
import type {
  SessionMetadata,
  SimulationSession,
  ChatMessage,
  WorldState,
} from "@/types";

export async function getAllSessions(): Promise<SessionMetadata[]> {
  const db = await getDB();
  const sessions = await db.getAll("sessions");
  return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
}

export async function getSession(
  id: string,
): Promise<SessionMetadata | undefined> {
  const db = await getDB();
  return db.get("sessions", id);
}

export async function saveSession(metadata: SessionMetadata): Promise<void> {
  const db = await getDB();
  await db.put("sessions", { ...metadata, lastUpdated: Date.now() });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ["sessions", "messages", "worldStates"],
    "readwrite",
  );
  await tx.objectStore("sessions").delete(id);

  const messageIndex = tx.objectStore("messages").index("by-session");
  let messageCursor = await messageIndex.openCursor(id);
  while (messageCursor) {
    await messageCursor.delete();
    messageCursor = await messageCursor.continue();
  }

  const worldStateIndex = tx.objectStore("worldStates").index("by-session");
  let wsCursor = await worldStateIndex.openCursor(id);
  while (wsCursor) {
    await wsCursor.delete();
    wsCursor = await wsCursor.continue();
  }

  await tx.done;
}

export async function saveFullSession(
  session: SimulationSession,
): Promise<void> {
  const db = await getDB();
  await saveSession(session.metadata);

  const tx = db.transaction(["messages", "worldStates"], "readwrite");

  const msgIndex = tx.objectStore("messages").index("by-session");
  let msgCursor = await msgIndex.openCursor(session.metadata.id);
  while (msgCursor) {
    await msgCursor.delete();
    msgCursor = await msgCursor.continue();
  }

  for (const message of session.messages) {
    await tx.objectStore("messages").put({
      ...message,
      sessionId: session.metadata.id,
    });
  }

  const wsIndex = tx.objectStore("worldStates").index("by-session");
  let wsCursor = await wsIndex.openCursor(session.metadata.id);
  while (wsCursor) {
    await wsCursor.delete();
    wsCursor = await wsCursor.continue();
  }

  if (session.worldState) {
    await tx.objectStore("worldStates").put({
      id: `${session.metadata.id}_current`,
      sessionId: session.metadata.id,
      turnIndex: session.messages.length,
      year: session.worldState.year,
      state: session.worldState,
      timestamp: Date.now(),
    });
  }

  await tx.done;
}

export async function loadFullSession(
  sessionId: string,
): Promise<SimulationSession | null> {
  const db = await getDB();
  const metadata = await getSession(sessionId);
  if (!metadata) return null;

  const tx = db.transaction(["messages", "worldStates"], "readonly");
  const messages = (await tx
    .objectStore("messages")
    .index("by-session")
    .getAll(sessionId)) as ChatMessage[];
  const worldStates = await tx
    .objectStore("worldStates")
    .index("by-session")
    .getAll(sessionId);

  const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp);
  const latestWorldState = worldStates.sort(
    (a, b) => b.turnIndex - a.turnIndex,
  )[0];

  return {
    metadata,
    messages: sortedMessages,
    worldState: latestWorldState
      ? (latestWorldState.state as WorldState)
      : null,
    historyPoints: [],
    suggestedActions: [],
    backgroundImage: null,
    causalChain: [],
    characterRelations: [],
  };
}
