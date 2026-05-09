export async function exportSession(): Promise<string> {
  return JSON.stringify({
    version: "1.0.0",
    type: "chronos-session",
    note: "Use save system instead",
  });
}

export async function importSession(): Promise<string> {
  throw new Error("Use the new save system import instead");
}

export async function exportAllSessions(): Promise<string> {
  return JSON.stringify({
    version: "1.0.0",
    type: "chronos-sessions-backup",
    data: [],
  });
}
