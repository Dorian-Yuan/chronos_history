import { saveFullSession, getAllSessions } from "./sessions";
import { getDB } from "./schema";

export async function exportSession(sessionId: string): Promise<string> {
  const db = await getDB();
  const metadata = await db.get("sessions", sessionId);
  if (!metadata) throw new Error("Session not found");

  const messages = await db.getAllFromIndex(
    "messages",
    "by-session",
    sessionId,
  );
  const worldStates = await db.getAllFromIndex(
    "worldStates",
    "by-session",
    sessionId,
  );

  const exportData = {
    version: "0.1.0",
    type: "chronos-session",
    exportedAt: new Date().toISOString(),
    data: {
      metadata,
      messages,
      worldStates,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importSession(jsonString: string): Promise<string> {
  const parsed = JSON.parse(jsonString);

  if (parsed.type !== "chronos-session") {
    throw new Error("Invalid session file format");
  }

  const { metadata, messages, worldStates } = parsed.data;

  await saveFullSession({
    metadata,
    messages,
    worldState: worldStates.length > 0 ? worldStates[0].state : null,
    historyPoints: [],
    suggestedActions: [],
    backgroundImage: null,
    causalChain: [],
    characterRelations: [],
  });

  return metadata.id;
}

export async function exportAllSessions(): Promise<string> {
  const sessions = await getAllSessions();
  const db = await getDB();
  const allData = [];

  for (const session of sessions) {
    const messages = await db.getAllFromIndex(
      "messages",
      "by-session",
      session.id,
    );
    const worldStates = await db.getAllFromIndex(
      "worldStates",
      "by-session",
      session.id,
    );
    allData.push({ metadata: session, messages, worldStates });
  }

  return JSON.stringify(
    {
      version: "0.1.0",
      type: "chronos-sessions-backup",
      exportedAt: new Date().toISOString(),
      data: allData,
    },
    null,
    2,
  );
}
