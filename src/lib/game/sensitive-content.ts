const SENSITIVE_KEYWORDS: string[] = [
  "习近平",
  "江泽民",
  "胡锦涛",
  "温家宝",
  "李克强",
  "天安门",
  "六四",
  "6.4",
  "64事件",
  "法轮功",
  "台独",
  "藏独",
  "疆独",
  "港独",
  "文化大革命",
  "文革",
  "反党",
  "反革命",
  "颠覆国家",
  "分裂国家",
];

export function checkObjectForSensitiveContent(obj: unknown): boolean {
  const str = JSON.stringify(obj);
  const lower = str.toLowerCase();
  return SENSITIVE_KEYWORDS.some((keyword) =>
    lower.includes(keyword.toLowerCase()),
  );
}
