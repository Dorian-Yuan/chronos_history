export const VALID_ATTITUDES = [
  "敌对",
  "求和",
  "中立",
  "友好",
  "臣服",
] as const;

export const ATTITUDE_NORMALIZE_MAP: Record<string, string> = {
  即将归附: "友好",
  倾向臣服: "友好",
  即将臣服: "友好",
  表面臣服: "臣服",
  归附: "臣服",
  归顺: "臣服",
  降服: "臣服",
  倾向敌对: "敌对",
  敌视: "敌对",
  仇恨: "敌对",
  敌意: "敌对",
  亲近: "友好",
  友善: "友好",
  亲善: "友好",
  和平: "求和",
  议和: "求和",
  示好: "求和",
  冷淡: "中立",
  疏远: "中立",
  观望: "中立",
};

export function normalizeAttitude(attitude: string): string {
  if (VALID_ATTITUDES.includes(attitude as (typeof VALID_ATTITUDES)[number]))
    return attitude;
  if (ATTITUDE_NORMALIZE_MAP[attitude]) return ATTITUDE_NORMALIZE_MAP[attitude];
  for (const valid of VALID_ATTITUDES) {
    if (attitude.includes(valid)) return valid;
  }
  return "中立";
}
