import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "chronos_db";
const DB_VERSION = 1;

export interface ChronosDB {
  sessions: {
    key: string;
    value: {
      id: string;
      title: string;
      lastUpdated: number;
      year: number;
      scenarioId: string;
    };
    indexes: { "by-scenario": string; "by-updated": number };
  };
  messages: {
    key: string;
    value: {
      id: string;
      sessionId: string;
      role: "user" | "ai" | "system";
      content: string;
      timestamp: number;
      backgroundImage?: string;
      audio?: string;
      isStreaming?: boolean;
    };
    indexes: { "by-session": string };
  };
  worldStates: {
    key: string;
    value: {
      id: string;
      sessionId: string;
      turnIndex: number;
      year: number;
      state: unknown;
      timestamp: number;
    };
    indexes: { "by-session": string };
  };
  settings: {
    key: string;
    value: {
      id: string;
      data: unknown;
    };
  };
}

let dbInstance: IDBPDatabase<ChronosDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ChronosDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ChronosDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("sessions")) {
        const sessionStore = db.createObjectStore("sessions", {
          keyPath: "id",
        });
        sessionStore.createIndex("by-scenario", "scenarioId");
        sessionStore.createIndex("by-updated", "lastUpdated");
      }

      if (!db.objectStoreNames.contains("messages")) {
        const messageStore = db.createObjectStore("messages", {
          keyPath: "id",
        });
        messageStore.createIndex("by-session", "sessionId");
      }

      if (!db.objectStoreNames.contains("worldStates")) {
        const worldStateStore = db.createObjectStore("worldStates", {
          keyPath: "id",
        });
        worldStateStore.createIndex("by-session", "sessionId");
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" });
      }
    },
  });

  return dbInstance;
}
