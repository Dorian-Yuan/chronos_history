export const JSON_OUTPUT_INSTRUCTION =
  "\n\n【输出格式】你必须只返回纯 JSON 对象，不要包含任何其他文字、解释、注释或 markdown 标记（如 ```json）。直接以 { 开头，以 } 结尾。";

export const SHARED_PROMPTS = {
  JSON_OUTPUT_INSTRUCTION,
} as const;
