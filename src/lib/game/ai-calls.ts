import type {
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  GameStats,
  PlayStyle,
  LifeMode,
  GameUniverse,
  AdvisorRole,
  AdvisorData,
  CounselMessage,
  CourtDebateMessage,
} from "@/types";
import type { AIMessage } from "@/types/ai-provider";
import { createProvider, withRetry } from "@/lib/ai";
import { useSettingsStore } from "@/stores";
import {
  scenarioCoreSchema,
  lifeScenarioCoreSchema,
  turnResultSchema,
  lifeTurnResultSchema,
  analysisSchema,
  counselSchema,
  courtDebateSchema,
} from "./schemas";
import { checkObjectForSensitiveContent } from "./sensitive-content";
import { HISTORY_PROMPTS } from "./ai-prompts/history-prompts";
import { LIFE_PROMPTS } from "./ai-prompts/life-prompts";
import { normalizeAttitude } from "./utils";

const REQUIRED_ADVISOR_ROLES: AdvisorRole[] = [
  "General",
  "Diplomat",
  "Intel",
  "Scholar",
  "Merchant",
];

function getPrompts(universe: GameUniverse) {
  return universe === "life" ? LIFE_PROMPTS : HISTORY_PROMPTS;
}

function getScenarioCoreSchema(universe: GameUniverse) {
  return universe === "life" ? lifeScenarioCoreSchema : scenarioCoreSchema;
}

function getTurnResultSchema(universe: GameUniverse) {
  return universe === "life" ? lifeTurnResultSchema : turnResultSchema;
}

function fixInitialStats(
  stats: ScenarioData["initial_stats"],
  universe: GameUniverse,
): ScenarioData["initial_stats"] {
  const min = universe === "life" ? 150 : 200;
  const max = universe === "life" ? 250 : 320;
  const sum =
    stats.stability +
    stats.economy +
    stats.military +
    stats.international_standing;

  if (sum >= min && sum <= max) return stats;

  let delta: number;
  if (sum < min) {
    delta = Math.ceil((min - sum + 4) / 4);
  } else {
    delta = -Math.ceil((sum - max + 4) / 4);
  }

  const fixed = {
    stability: Math.max(0, Math.min(100, stats.stability + delta)),
    economy: Math.max(0, Math.min(100, stats.economy + delta)),
    military: Math.max(0, Math.min(100, stats.military + delta)),
    international_standing: Math.max(
      0,
      Math.min(100, stats.international_standing + delta),
    ),
  };

  console.log(
    `[fixInitialStats] 总和${sum}超出[${min},${max}]，每维调整${delta}，修复后总和=${fixed.stability + fixed.economy + fixed.military + fixed.international_standing}`,
  );
  return fixed;
}

function fixInternalFactions(scenario: ScenarioData): ScenarioData {
  if (scenario.play_style !== "Conquest" || !Array.isArray(scenario.factions)) {
    return scenario;
  }

  const internalKeywords = [
    "主和",
    "主战",
    "改革",
    "保守",
    "宫廷",
    "宦官",
    "外戚",
    "边军",
    "禁军",
    "军阀",
    "商盟",
    "行会",
    "商会",
    "贵族",
    "地主",
    "农民",
    "百姓",
    "朝臣",
  ];

  const internalFactions = scenario.factions.filter((f) => {
    const text = `${f.name} ${f.description} ${f.attitude}`;
    return internalKeywords.some((kw) => text.includes(kw));
  });

  if (internalFactions.length <= 1) return scenario;

  const firstInternalName = internalFactions[0].name;
  const fixedFactions = scenario.factions.filter((f) => {
    if (f.name === firstInternalName) return true;
    const text = `${f.name} ${f.description} ${f.attitude}`;
    const isInternal = internalKeywords.some((kw) => text.includes(kw));
    return !isInternal;
  });

  console.log(
    `[fixInternalFactions] Conquest模式内部势力${internalFactions.length}个超限，保留首个"${firstInternalName}"，修复后派系数=${fixedFactions.length}`,
  );

  return { ...scenario, factions: fixedFactions };
}

function fixExternalFactions(scenario: ScenarioData): ScenarioData {
  if (!scenario.life_mode || !Array.isArray(scenario.factions)) {
    return scenario;
  }

  const externalKeywords = [
    "入侵",
    "侵略",
    "蛮族",
    "外敌",
    "敌国",
    "异族",
    "边境",
    "游牧",
  ];

  const fixedFactions = scenario.factions.filter((f) => {
    const text = `${f.name} ${f.description}`;
    return !externalKeywords.some((kw) => text.includes(kw));
  });

  if (fixedFactions.length < scenario.factions.length) {
    console.log(
      `[fixExternalFactions] Life宇宙移除${scenario.factions.length - fixedFactions.length}个外部派系`,
    );
  }

  return {
    ...scenario,
    factions: fixedFactions.length >= 3 ? fixedFactions : scenario.factions,
  };
}

const PLACEHOLDER_NAMES_HISTORY = [
  "陈伯年",
  "林正则",
  "赵明远",
  "周守义",
  "吴承恩",
];
const PLACEHOLDER_NAMES_LIFE = [
  "沈清臣",
  "顾怀安",
  "刘慎行",
  "杨守正",
  "韩世忠",
];

function generatePlaceholderName(
  universe: GameUniverse,
  index: number,
): string {
  const names =
    universe === "life" ? PLACEHOLDER_NAMES_LIFE : PLACEHOLDER_NAMES_HISTORY;
  return names[index % names.length];
}

const PLACEHOLDER_FACTIONS_HISTORY = [
  {
    name: "守旧派",
    description: "坚持传统体制的保守势力",
    strength: "根基深厚",
    weakness: "缺乏创新",
    needs: "维持现状",
    attitude: "中立" as const,
  },
  {
    name: "革新派",
    description: "主张变革的新兴力量",
    strength: "锐意进取",
    weakness: "根基尚浅",
    needs: "扩大影响",
    attitude: "求和" as const,
  },
  {
    name: "中立派",
    description: "在各方之间寻求平衡的势力",
    strength: "灵活机动",
    weakness: "立场不稳",
    needs: "各方认可",
    attitude: "中立" as const,
  },
];

const PLACEHOLDER_FACTIONS_LIFE = [
  {
    name: "清流党",
    description: "以清廉自居的朝堂势力",
    strength: "声望清高",
    weakness: "缺乏实权",
    needs: "圣眷加持",
    attitude: "友好" as const,
  },
  {
    name: "权臣派",
    description: "把持朝政的实力派系",
    strength: "权势滔天",
    weakness: "树敌众多",
    needs: "巩固地位",
    attitude: "求和" as const,
  },
  {
    name: "外戚派",
    description: "依仗后宫关系的势力集团",
    strength: "圣眷优渥",
    weakness: "根基不牢",
    needs: "拉拢朝臣",
    attitude: "中立" as const,
  },
];

function fixMissingAdvisors(
  scenario: ScenarioData,
  universe: GameUniverse,
): ScenarioData {
  const advisors = Array.isArray(scenario.initial_advisors)
    ? scenario.initial_advisors
    : [];
  const roleLabels = getRoleLabels(universe);
  const fixed = [...advisors];
  const existingRoles = new Set(fixed.map((a) => a.role));

  for (const requiredRole of REQUIRED_ADVISOR_ROLES) {
    if (!existingRoles.has(requiredRole)) {
      const idx = REQUIRED_ADVISOR_ROLES.indexOf(requiredRole);
      fixed.push({
        role: requiredRole,
        name: generatePlaceholderName(universe, idx),
        advice: `（${roleLabels[requiredRole]}的建议待补充）`,
        bias: "稳健派：主张审慎行事",
        hidden_motive: "暂无",
      });
    }
  }

  const seen = new Set<string>();
  const deduped: AdvisorData[] = [];
  for (const a of fixed) {
    if (!seen.has(a.role)) {
      seen.add(a.role);
      deduped.push(a);
    }
  }

  if (deduped.length < fixed.length) {
    console.log(
      `[fixMissingAdvisors] 去重：${fixed.length}个顾问→${deduped.length}个`,
    );
  }
  if (deduped.length < 5) {
    console.log(
      `[fixMissingAdvisors] 补全后顾问数=${deduped.length}，缺失角色已自动生成`,
    );
  }

  return { ...scenario, initial_advisors: deduped };
}

function fixMissingLifeFields(scenario: ScenarioData): ScenarioData {
  if (!scenario.life_mode) return scenario;

  const fixed = { ...scenario };
  fixed.player_context = { ...scenario.player_context };

  if (!fixed.player_context.official_rank) {
    fixed.player_context.official_rank = {
      level: 6,
      title: "员外郎",
      department: "礼部",
      is_military: false,
    };
    console.log("[fixMissingLifeFields] 自动补充official_rank");
  }
  if (
    fixed.player_context.official_rank.level < 5 ||
    fixed.player_context.official_rank.level > 7
  ) {
    const originalLevel = fixed.player_context.official_rank.level;
    fixed.player_context.official_rank = {
      ...fixed.player_context.official_rank,
      level: Math.max(5, Math.min(7, fixed.player_context.official_rank.level)),
    };
    console.log(
      `[fixMissingLifeFields] 品级level=${originalLevel}超出5-7范围，修正为${fixed.player_context.official_rank.level}`,
    );
  }

  if (!fixed.player_context.superior_title?.trim()) {
    fixed.player_context.superior_title = "皇帝";
    console.log("[fixMissingLifeFields] 自动补充superior_title");
  }
  if (!fixed.player_context.superior_name?.trim()) {
    fixed.player_context.superior_name = "赵德昭";
    console.log("[fixMissingLifeFields] 自动补充superior_name");
  }

  return fixed;
}

function normalizeFactionAttitudes(scenario: ScenarioData): ScenarioData {
  if (!Array.isArray(scenario.factions)) return scenario;
  const normalized = scenario.factions.map((f) => {
    const original = f.attitude;
    const normalizedAttitude = normalizeAttitude(original);
    if (original !== normalizedAttitude) {
      console.log(
        `[normalizeFactionAttitudes] 派系"${f.name}"态度"${original}"→"${normalizedAttitude}"`,
      );
    }
    return { ...f, attitude: normalizedAttitude };
  });
  return { ...scenario, factions: normalized };
}

function fixFactionsCount(
  scenario: ScenarioData,
  universe: GameUniverse,
): ScenarioData {
  if (Array.isArray(scenario.factions) && scenario.factions.length >= 3)
    return scenario;

  const fixed = [...(scenario.factions || [])];
  const placeholders =
    universe === "life"
      ? PLACEHOLDER_FACTIONS_LIFE
      : PLACEHOLDER_FACTIONS_HISTORY;

  while (fixed.length < 3) {
    const idx = fixed.length;
    const p = placeholders[idx % placeholders.length];
    fixed.push({
      name: p.name,
      leader: generatePlaceholderName(universe, idx + 5),
      description: p.description,
      strength: p.strength,
      weakness: p.weakness,
      needs: p.needs,
      attitude: p.attitude,
    });
  }

  console.log(`[fixFactionsCount] 派系不足3个，补充至${fixed.length}个`);

  return { ...scenario, factions: fixed };
}

function validateScenario(data: ScenarioData, universe: GameUniverse): void {
  const errors: string[] = [];

  if (!data.player_context?.nation_name?.trim()) {
    errors.push("nation_name为空");
  }
  if (!data.player_context?.leader_title?.trim()) {
    errors.push("leader_title为空");
  }
  if (!data.description?.trim()) {
    errors.push("剧本描述为空");
  }
  if (!data.title?.trim()) {
    errors.push("剧本标题为空");
  }

  if (data.initial_stats) {
    const stats = data.initial_stats;
    const sum =
      (stats.stability ?? 0) +
      (stats.economy ?? 0) +
      (stats.military ?? 0) +
      (stats.international_standing ?? 0);
    const min = universe === "life" ? 150 : 200;
    const max = universe === "life" ? 250 : 320;
    const maxSingle = universe === "life" ? 60 : 85;
    if (sum < min || sum > max) {
      errors.push(`初始属性总和${sum}不在${min}-${max}范围内`);
    }
    const maxStat = Math.max(
      stats.stability ?? 0,
      stats.economy ?? 0,
      stats.military ?? 0,
      stats.international_standing ?? 0,
    );
    if (maxStat > maxSingle) {
      errors.push(`单项属性${maxStat}超过${maxSingle}上限`);
    }
  } else {
    errors.push("initial_stats缺失");
  }

  if (
    !Array.isArray(data.initial_advisors) ||
    data.initial_advisors.length < 5
  ) {
    errors.push(
      `初始顾问数量${Array.isArray(data.initial_advisors) ? data.initial_advisors.length : 0}不足5个`,
    );
  } else {
    const roles = new Set(data.initial_advisors.map((a) => a.role));
    const missingRoles = REQUIRED_ADVISOR_ROLES.filter((r) => !roles.has(r));
    if (missingRoles.length > 0) {
      errors.push(`缺少顾问角色: ${missingRoles.join(", ")}`);
    }
  }

  if (!Array.isArray(data.factions) || data.factions.length < 3) {
    errors.push(
      `初始派系数量${Array.isArray(data.factions) ? data.factions.length : 0}不足3个`,
    );
  }

  if (
    universe === "history" &&
    data.play_style === "Conquest" &&
    Array.isArray(data.factions)
  ) {
    const internalKeywords = [
      "主和",
      "主战",
      "改革",
      "保守",
      "宫廷",
      "宦官",
      "外戚",
      "边军",
      "禁军",
      "军阀",
      "商盟",
      "行会",
      "商会",
      "贵族",
      "地主",
      "农民",
      "百姓",
      "朝臣",
    ];
    const internalFactions = data.factions.filter((f) => {
      const text = `${f.name} ${f.description} ${f.attitude}`;
      return internalKeywords.some((kw) => text.includes(kw));
    });
    if (internalFactions.length > 1) {
      errors.push(`征服模式内部势力过多（${internalFactions.length}个）`);
    }
  }

  if (universe === "life") {
    if (!data.player_context?.official_rank) {
      errors.push("life宇宙缺少official_rank");
    } else {
      const level = data.player_context.official_rank.level;
      if (level < 0 || level > 9) {
        errors.push(`品级level=${level}不在0-9范围内`);
      }
    }
    if (!data.player_context?.superior_title?.trim()) {
      errors.push("life宇宙缺少superior_title");
    }
    if (!data.player_context?.superior_name?.trim()) {
      errors.push("life宇宙缺少superior_name");
    }
  }

  if (errors.length > 0) {
    throw new Error(`剧本验证失败: ${errors.join("; ")}`);
  }
}

function validateTurnResult(data: TurnResult): void {
  const errors: string[] = [];

  if (!data.narrative?.trim()) {
    errors.push("叙事内容为空");
  }
  if (!data.headline?.trim()) {
    errors.push("标题为空");
  }
  if (!data.stats_delta) {
    errors.push("stats_delta缺失");
  }
  if (!Array.isArray(data.advisors) || data.advisors.length < 5) {
    errors.push(`顾问数量不足5个`);
  }
  if (!Array.isArray(data.factions_update)) {
    errors.push("factions_update缺失");
  }

  const VALID_ATTITUDES = ["敌对", "求和", "中立", "友好", "臣服"];
  if (Array.isArray(data.factions_update)) {
    for (const faction of data.factions_update) {
      if (faction.attitude && !VALID_ATTITUDES.includes(faction.attitude)) {
        errors.push(
          `派系"${faction.name}"的attitude值"${faction.attitude}"不合法`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`回合结果验证失败: ${errors.join("; ")}`);
  }
}

function getProvider() {
  const settings = useSettingsStore.getState();
  const aiProviderSetting = settings.getAIProvider();
  if (!aiProviderSetting) {
    throw new Error("AI provider not configured");
  }
  return createProvider(aiProviderSetting);
}

function parseResponse<T>(
  content: string,
  provider: ReturnType<typeof createProvider>,
): T {
  const parsed = provider.parseJSONResponse(content);
  return parsed as T;
}

const ROLE_LABELS: Record<AdvisorRole, string> = {
  General: "将军",
  Diplomat: "外交官",
  Intel: "密探",
  Scholar: "学者",
  Merchant: "商人",
};

const LIFE_ROLE_LABELS: Record<AdvisorRole, string> = {
  General: "武官",
  Diplomat: "礼官",
  Intel: "暗探",
  Scholar: "文官",
  Merchant: "商贾",
};

function getRoleLabels(universe: GameUniverse) {
  return universe === "life" ? LIFE_ROLE_LABELS : ROLE_LABELS;
}

function normalizeRecommendedAdvisor(
  recommendedAdvisor: string,
  advisors: { role: string; name: string }[],
  universe: GameUniverse,
): string {
  if (!recommendedAdvisor) return recommendedAdvisor;

  const advisorNames = advisors.map((a) => a.name);
  if (advisorNames.includes(recommendedAdvisor)) return recommendedAdvisor;

  const roleLabels = getRoleLabels(universe);

  const roleToName = new Map<string, string>();
  for (const a of advisors) {
    roleToName.set(a.role, a.name);
    const label = roleLabels[a.role as AdvisorRole];
    if (label) {
      roleToName.set(label, a.name);
    }
  }

  const mapped = roleToName.get(recommendedAdvisor);
  if (mapped) {
    console.log(
      `[normalizeRecommendedAdvisor] "${recommendedAdvisor}" → "${mapped}"`,
    );
    return mapped;
  }

  for (const name of advisorNames) {
    if (
      recommendedAdvisor.includes(name) ||
      name.includes(recommendedAdvisor)
    ) {
      return name;
    }
  }

  console.warn(
    `[normalizeRecommendedAdvisor] 无法匹配 "${recommendedAdvisor}"，顾问名单：${advisorNames.join(", ")}`,
  );
  return recommendedAdvisor;
}

export async function generateScenario(
  playStyleOrLifeMode: PlayStyle | LifeMode,
  userHint?: string,
  onProgress?: (stage: string) => void,
  universe: GameUniverse = "history",
): Promise<ScenarioData> {
  const provider = getProvider();
  const prompts = getPrompts(universe);

  const structuredOutputSupported = provider.supportsStructuredOutput();
  console.log(
    "[generateScenario] provider:",
    provider.id,
    "supportsStructuredOutput:",
    structuredOutputSupported,
    "universe:",
    universe,
  );

  const isLife = universe === "life";
  const styleLabel = isLife ? "人生轨迹" : "执政基调";
  const styleValue = playStyleOrLifeMode;

  const userContent = `${styleLabel}：${styleValue}\n\n请以50%概率选择中国封建王朝（清朝之前）、50%概率选择其他文明。优先选择冷门时期，绝对禁止选择三国、楚汉等大热门，绝对禁止草原汗国/游牧帝国背景。所有人物名必须是虚构的，不能使用真实历史人物名。${userHint ? `\n\n【玩家自定义要求——极其重要，必须重点参考】\n${userHint}\n\n你必须在生成剧本时重点考虑以上玩家要求。` : ""}`;

  onProgress?.(isLife ? "正在构思仕途背景..." : "正在构思历史背景...");
  const coreSystemPrompt = structuredOutputSupported
    ? prompts.SCENARIO_SYSTEM_PROMPT
    : prompts.SCENARIO_SYSTEM_PROMPT + prompts.SCENARIO_CORE_SCHEMA_PROMPT;

  const coreResult = await withRetry(
    async () => {
      const response = await provider.sendMessage(
        [
          { role: "system", content: coreSystemPrompt },
          { role: "user", content: userContent },
        ],
        {
          responseFormat: "json",
          responseSchema: getScenarioCoreSchema(universe),
          temperature: 0.85,
          maxTokens: 2048,
        },
      );

      return parseResponse<Partial<ScenarioData>>(response.content, provider);
    },
    { maxRetries: 3 },
  );

  console.log("[generateScenario] Stage 1 core:", {
    title: coreResult.title,
    nation: coreResult.player_context?.nation_name,
    stats: coreResult.initial_stats,
  });

  onProgress?.(
    isLife ? "正在招募同僚与评估势力..." : "正在招募顾问与评估势力...",
  );
  const detailsSystemPrompt = isLife
    ? `你是Chronos人生推演引擎的同僚与派系生成器。根据已确定的核心设定，生成同僚和派系。

【语言规则】所有文本字段必须使用简体中文。

【硬性约束——必须全部满足，否则输出无效】
1. 必须恰好5个同僚，角色分别为：General、Diplomat、Intel、Scholar、Merchant，缺一不可
2. 3-4个派系，每个含leader字段，全部为朝堂内部派系
3. 人名全部虚构，禁止奇幻风格
4. 派系名真实可信，禁止奇幻风格
5. 2-3个initial_decision_options
6. 派系attitude只能取以下5个值之一：敌对、求和、中立、友好、臣服。禁止使用其他任何值（如"归顺""敌视"等均不合法）
7. 禁止纯外部入侵者派系

【生成后自检——返回前必须逐项确认】
1. 是否恰好5个同僚且5个角色齐全（General/Diplomat/Intel/Scholar/Merchant）？
2. 是否3-4个派系且每个有leader？
3. 派系是否全部为朝堂内部派系？
4. 是否有2-3个initial_decision_options？
5. 每个派系attitude是否为5个合法值之一（敌对/求和/中立/友好/臣服）？
6. 所有文本是否为简体中文？
不通过则修正后再输出${prompts.JSON_OUTPUT_INSTRUCTION}`
    : `你是Chronos历史推演引擎的顾问与派系生成器。根据已确定的核心设定，生成顾问和派系。

【语言规则】所有文本字段必须使用简体中文。

【硬性约束——必须全部满足，否则输出无效】
1. 必须恰好5个顾问，角色分别为：General、Diplomat、Intel、Scholar、Merchant，缺一不可
2. 3-4个派系，每个含leader字段
3. 人名全部虚构，禁止奇幻风格，按文明传统命名
4. 派系名真实可信，禁止奇幻风格
5. 2-3个initial_decision_options
6. 派系构成须符合基调：Conquest至少3外部，Prosperity经济集团为主，Reform至少3内部，Survival内外兼有
7. 派系attitude只能取以下5个值之一：敌对、求和、中立、友好、臣服。禁止使用其他任何值（如"归顺""敌视"等均不合法）

【生成后自检——返回前必须逐项确认】
1. 是否恰好5个顾问且5个角色齐全（General/Diplomat/Intel/Scholar/Merchant）？
2. 是否3-4个派系且每个有leader？
3. 人名是否符合文明传统？无奇幻风格？
4. 派系构成是否符合基调？
5. 是否有2-3个initial_decision_options？
6. 每个派系attitude是否为5个合法值之一（敌对/求和/中立/友好/臣服）？
7. 所有文本是否为简体中文？
不通过则修正后再输出${prompts.JSON_OUTPUT_INSTRUCTION}`;

  const detailsSchemaPrompt = structuredOutputSupported
    ? ""
    : prompts.SCENARIO_DETAILS_SCHEMA_PROMPT;

  const officialdomInfo =
    isLife && coreResult.player_context?.official_rank
      ? `\n- 品级：${coreResult.player_context.official_rank.level === 0 ? "超品" : `${coreResult.player_context.official_rank.level}品`}${coreResult.player_context.official_rank.title ? ` ${coreResult.player_context.official_rank.title}` : ""}${coreResult.player_context.official_rank.department ? `（${coreResult.player_context.official_rank.department}）` : ""}\n- 上位者：${coreResult.player_context.superior_title || ""} ${coreResult.player_context.superior_name || ""}`
      : "";

  const detailsUserContent = `核心设定：
- 标题：${coreResult.title}
- ${isLife ? "衙门" : "国家"}：${coreResult.player_context?.nation_name}
- ${isLife ? "大人" : "领袖"}头衔：${coreResult.player_context?.leader_title}
- 背景：${coreResult.player_context?.background_summary}
- ${styleLabel}：${styleValue}
- 描述：${coreResult.description}${officialdomInfo}

请生成${isLife ? "同僚" : "顾问"}、派系和初始决策选项。`;

  const scenario = await withRetry(
    async () => {
      const response = await provider.sendMessage(
        [
          {
            role: "system",
            content: detailsSystemPrompt + detailsSchemaPrompt,
          },
          { role: "user", content: detailsUserContent },
        ],
        {
          responseFormat: "json",
          temperature: 0.85,
          maxTokens: 2048,
        },
      );

      const detailsResult = parseResponse<{
        initial_advisors: ScenarioData["initial_advisors"];
        factions: ScenarioData["factions"];
        initial_decision_options?: ScenarioData["initial_decision_options"];
      }>(response.content, provider);

      if (
        Array.isArray(detailsResult.initial_decision_options) &&
        Array.isArray(detailsResult.initial_advisors)
      ) {
        for (const opt of detailsResult.initial_decision_options) {
          if (opt.recommended_advisor) {
            opt.recommended_advisor = normalizeRecommendedAdvisor(
              opt.recommended_advisor,
              detailsResult.initial_advisors,
              universe,
            );
          }
        }
      }

      const merged: ScenarioData = {
        id: coreResult.id || `scenario_${Date.now()}`,
        title: coreResult.title || "",
        description: coreResult.description || "",
        player_context: coreResult.player_context || {
          nation_name: "",
          leader_title: "",
          background_summary: "",
        },
        initial_stats: fixInitialStats(
          coreResult.initial_stats || {
            stability: 50,
            economy: 50,
            military: 50,
            international_standing: 50,
          },
          universe,
        ),
        hidden_real_event: coreResult.hidden_real_event || "",
        play_style: isLife
          ? undefined
          : coreResult.play_style || (playStyleOrLifeMode as PlayStyle),
        life_mode: isLife
          ? coreResult.life_mode || (playStyleOrLifeMode as LifeMode)
          : undefined,
        start_date: coreResult.start_date || "",
        initial_advisors: Array.isArray(detailsResult.initial_advisors)
          ? detailsResult.initial_advisors
          : [],
        factions: Array.isArray(detailsResult.factions)
          ? detailsResult.factions
          : [],
        initial_decision_options: detailsResult.initial_decision_options,
      };

      let fixedScenario = merged;
      if (isLife) {
        fixedScenario = fixExternalFactions(fixedScenario);
      } else {
        fixedScenario = fixInternalFactions(fixedScenario);
      }

      fixedScenario = fixMissingAdvisors(fixedScenario, universe);
      if (isLife) {
        fixedScenario = fixMissingLifeFields(fixedScenario);
      }
      fixedScenario = normalizeFactionAttitudes(fixedScenario);
      fixedScenario = fixFactionsCount(fixedScenario, universe);

      if (fixedScenario.factions.length < 3) {
        throw new Error(
          `修复势力后派系仅剩${fixedScenario.factions.length}个，不足3个，需重新生成`,
        );
      }

      validateScenario(fixedScenario, universe);

      if (checkObjectForSensitiveContent(fixedScenario)) {
        throw new Error(
          "Generated content contains sensitive keywords, retrying...",
        );
      }

      return fixedScenario;
    },
    { maxRetries: 3 },
  );

  console.log("[generateScenario] Stage 2 details:", {
    advisors: scenario.initial_advisors?.length,
    factions: scenario.factions?.length,
  });

  return scenario;
}

export async function counselAdvisor(
  advisor: AdvisorData,
  scenario: ScenarioData,
  stats: GameStats,
  historyLog: string[],
  currentSituation: string,
  conversationHistory: CounselMessage[],
  universe: GameUniverse = "history",
): Promise<string> {
  const provider = getProvider();
  const prompts = getPrompts(universe);
  const roleLabels = getRoleLabels(universe);

  const roleLabel = roleLabels[advisor.role] || advisor.role;
  const recentHistory =
    historyLog.length > 0
      ? historyLog
          .slice(-2)
          .map((h, i) => `回合${historyLog.length - 1 + i}: ${h}`)
          .join("\n")
      : "（无）";

  const statLabels =
    universe === "life"
      ? {
          stability: "威望",
          economy: "财力",
          military: "权势",
          international_standing: "圣眷",
        }
      : {
          stability: "稳定",
          economy: "经济",
          military: "军事",
          international_standing: "声望",
        };

  const systemPrompt = prompts.COUNSEL_SYSTEM_PROMPT.replace(
    "{advisor_name}",
    advisor.name,
  )
    .replace("{role_label}", roleLabel)
    .replace("{role}", advisor.role)
    .replace("{bias}", advisor.bias)
    .replace("{hidden_motive}", advisor.hidden_motive || "无")
    .replace("{nation_name}", scenario.player_context.nation_name)
    .replace("{leader_title}", scenario.player_context.leader_title)
    .replace("{stability}", `${statLabels.stability}${stats.stability}`)
    .replace("{economy}", `${statLabels.economy}${stats.economy}`)
    .replace("{military}", `${statLabels.military}${stats.military}`)
    .replace(
      "{international_standing}",
      `${statLabels.international_standing}${stats.international_standing}`,
    )
    .replace("{situation_update}", currentSituation || "暂无特别局势变化")
    .replace("{recent_history}", recentHistory)
    .replace(/{leader_title}/g, scenario.player_context.leader_title);

  const fullSystemPrompt = provider.supportsStructuredOutput()
    ? systemPrompt
    : systemPrompt + prompts.COUNSEL_SCHEMA_PROMPT;

  const messages: AIMessage[] = [
    { role: "system", content: fullSystemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    })),
  ];

  if (conversationHistory.length >= 2) {
    messages.push({
      role: "user" as const,
      content:
        '（请继续严格以JSON格式回复：{"response": "你的回应"}，不要输出任何其他内容）',
    });
  }

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: counselSchema,
        temperature: 0.75,
        maxTokens: 1500,
      });

      const result = parseResponse<{ response: string }>(
        response.content,
        provider,
      );

      if (!result.response?.trim()) {
        throw new Error("顾问回应为空");
      }

      return result.response;
    },
    { maxRetries: 2 },
  );
}

export async function evaluateTurn(
  scenario: ScenarioData,
  historyLog: string[],
  userAction: string,
  currentStats: GameStats,
  turnCount: number,
  currentAdvisors?: { role: string; name: string }[],
  currentDateDisplay?: string,
  recentPlayerActions?: string[],
  identityChangeCount?: { nation_name: number; leader_title: number },
  universe: GameUniverse = "history",
  currentSituation?: string,
  recentSituations?: string[],
): Promise<TurnResult> {
  const provider = getProvider();
  const prompts = getPrompts(universe);
  const isLife = universe === "life";

  const systemPrompt = provider.supportsStructuredOutput()
    ? prompts.TURN_SYSTEM_PROMPT
    : prompts.TURN_SYSTEM_PROMPT + prompts.TURN_SCHEMA_PROMPT;

  const recentActionsSection =
    recentPlayerActions && recentPlayerActions.length > 0
      ? `\n近期玩家行动（以最新为准，旧行动若与新行动矛盾则已自动失效）：\n${recentPlayerActions.map((a, i) => `- 回合${turnCount - recentPlayerActions.length + i}：${a}`).join("\n")}\n`
      : "";

  const currentSituationSection = currentSituation
    ? `\n当前局势（上一回合的挑战/危机，你必须在situation_update中先确认其解决状态）：${currentSituation}\n`
    : "";

  const recentSituationsSection =
    recentSituations && recentSituations.length > 0
      ? `\n近期局势演变（供参考，判断问题是否反复出现）：\n${recentSituations.map((s, i) => `- 回合${turnCount - recentSituations.length + i}：${s}`).join("\n")}\n`
      : "";

  const statLabels = isLife
    ? {
        stability: "威望",
        economy: "财力",
        military: "权势",
        international_standing: "圣眷",
      }
    : {
        stability: "稳定性",
        economy: "经济",
        military: "军事",
        international_standing: "国际声望",
      };

  const officialdomSection =
    isLife && scenario.player_context.official_rank
      ? `\n品级信息：${scenario.player_context.official_rank.level === 0 ? "超品" : `${scenario.player_context.official_rank.level}品`} ${scenario.player_context.official_rank.title}（${scenario.player_context.official_rank.department}）\n上位者：${scenario.player_context.superior_title || ""} ${scenario.player_context.superior_name || ""}`
      : "";

  const contextMessage = `当前剧本：${scenario.title}
玩家${isLife ? "衙门" : "国家"}：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}
${isLife ? "人生轨迹" : "执政基调"}：${isLife ? scenario.life_mode : scenario.play_style}
初始纪年：${scenario.start_date}
当前纪年：${currentDateDisplay || scenario.start_date}
当前回合：第${turnCount}回合

当前属性：
- ${statLabels.stability}(stability)：${currentStats.stability}
- ${statLabels.economy}(economy)：${currentStats.economy}
- ${statLabels.military}(military)：${currentStats.military}
- ${statLabels.international_standing}(international_standing)：${currentStats.international_standing}
${officialdomSection}

当前${isLife ? "同僚" : "顾问"}名单（必须保持一致，除非满足极端更换条件）：
${currentAdvisors && currentAdvisors.length > 0 ? currentAdvisors.map((a) => `- ${getRoleLabels(universe)[a.role as AdvisorRole]}：${a.name}`).join("\n") : scenario.initial_advisors.map((a) => `- ${getRoleLabels(universe)[a.role as AdvisorRole]}：${a.name}`).join("\n")}

历史日志（AI长期记忆）：
${historyLog.length > 0 ? historyLog.map((h, i) => `回合${i + 1}: ${h}`).join("\n") : "（无）"}
${recentActionsSection}${currentSituationSection}${recentSituationsSection}
当前派系：
${scenario.factions.map((f) => `- ${f.name}（领袖：${f.leader || "未知"}，${f.attitude}）：${f.description}`).join("\n")}

玩家行动：${userAction}

身份变更记录：${isLife ? "衙门" : "国家"}名已变更${identityChangeCount?.nation_name ?? 0}次（上限2次），${isLife ? "官职" : "头衔"}已变更${identityChangeCount?.leader_title ?? 0}次（上限3次）${turnCount <= 3 ? "\n注意：前3回合内禁止任何品级变更" : turnCount <= 8 ? "\n注意：4-8回合可小幅升迁（最多1品），不允许降职" : ""}`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: contextMessage },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: getTurnResultSchema(universe),
        temperature: 0.8,
        maxTokens: 4096,
      });

      const result = parseResponse<TurnResult>(response.content, provider);

      validateTurnResult(result);

      if (Array.isArray(result.decision_options)) {
        const advisorsForNorm =
          currentAdvisors && currentAdvisors.length > 0
            ? currentAdvisors
            : scenario.initial_advisors;
        for (const opt of result.decision_options) {
          if (opt.recommended_advisor) {
            opt.recommended_advisor = normalizeRecommendedAdvisor(
              opt.recommended_advisor,
              advisorsForNorm,
              universe,
            );
          }
        }
      }

      if (checkObjectForSensitiveContent(result)) {
        throw new Error(
          "Generated content contains sensitive keywords, retrying...",
        );
      }

      return result;
    },
    { maxRetries: 3 },
  );
}

export async function analyzeGame(
  scenario: ScenarioData,
  historyLog: string[],
  conditionalOutcome?: { title: string; description: string; base: string },
  universe: GameUniverse = "history",
): Promise<EndGameAnalysis> {
  const provider = getProvider();
  const prompts = getPrompts(universe);
  const isLife = universe === "life";

  const outcomeTitle =
    conditionalOutcome?.title || (isLife ? "浮沉不定" : "存续之主");
  const outcomeDescription =
    conditionalOutcome?.description ||
    (isLife ? "仕途坎坷。" : "不好不坏的统治。");
  const outcomeBase = conditionalOutcome?.base || "neutral";
  const baseLabel =
    outcomeBase === "victory"
      ? isLife
        ? "功成"
        : "胜利"
      : outcomeBase === "defeat"
        ? isLife
          ? "落魄"
          : "失败"
        : isLife
          ? "浮沉"
          : "存续";

  let systemPrompt: string = prompts.ANALYSIS_SYSTEM_PROMPT;
  if (!provider.supportsStructuredOutput()) {
    systemPrompt += prompts.ANALYSIS_SCHEMA_PROMPT;
  }

  systemPrompt = systemPrompt
    .replace(/{conditional_outcome_title}/g, outcomeTitle)
    .replace(/{conditional_outcome_description}/g, outcomeDescription)
    .replace(/{conditional_outcome_base}/g, baseLabel);

  const contextMessage = `剧本：${scenario.title}
真实历史事件：${scenario.hidden_real_event}
玩家${isLife ? "衙门" : "国家"}：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}
${isLife ? "人生轨迹" : "执政基调"}：${isLife ? scenario.life_mode : scenario.play_style}

历史日志：
${historyLog.map((h, i) => `回合${i + 1}: ${h}`).join("\n")}`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: contextMessage },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: analysisSchema,
        temperature: 0.7,
        maxTokens: 4096,
      });

      const analysis = parseResponse<EndGameAnalysis>(
        response.content,
        provider,
      );

      if (checkObjectForSensitiveContent(analysis)) {
        throw new Error(
          "Generated content contains sensitive keywords, retrying...",
        );
      }

      return analysis;
    },
    { maxRetries: 3 },
  );
}

export interface CourtDebateResponse {
  speaker_role: AdvisorRole;
  speaker_name: string;
  stance: "support" | "oppose" | "supplement";
  content: string;
}

export async function courtDebate(
  topic: string,
  scenario: ScenarioData,
  stats: GameStats,
  historyLog: string[],
  currentSituation: string,
  currentDateDisplay: string,
  advisors: AdvisorData[],
  debateHistory: CourtDebateMessage[],
  remainingRounds: number,
  universe: GameUniverse = "history",
): Promise<CourtDebateResponse> {
  const provider = getProvider();
  const prompts = getPrompts(universe);
  const roleLabels = getRoleLabels(universe);
  const isLife = universe === "life";

  const statLabels = isLife
    ? {
        stability: "威望",
        economy: "财力",
        military: "权势",
        international_standing: "圣眷",
      }
    : {
        stability: "稳定",
        economy: "经济",
        military: "军事",
        international_standing: "声望",
      };

  const advisorsInfo = advisors
    .map(
      (a) =>
        `- ${roleLabels[a.role]}（${a.role}）：${a.name}，倾向：${a.bias}，秘密动机：${a.hidden_motive || "无"}`,
    )
    .join("\n");

  const recentHistory =
    historyLog.length > 0
      ? historyLog
          .slice(-2)
          .map((h, i) => `回合${historyLog.length - 1 + i}: ${h}`)
          .join("\n")
      : "（无）";

  const stanceLabels = isLife
    ? { support: "附议", oppose: "驳斥", supplement: "补充" }
    : { support: "支持", oppose: "驳斥", supplement: "补充" };

  const debateHistoryText =
    debateHistory.length > 0
      ? debateHistory
          .map((msg) => {
            if (msg.role === "user") {
              return `【${scenario.player_context.leader_title}】${msg.content}`;
            }
            const stanceLabel =
              msg.stance === "support"
                ? stanceLabels.support
                : msg.stance === "oppose"
                  ? stanceLabels.oppose
                  : stanceLabels.supplement;
            return `【${roleLabels[msg.advisorRole!] ?? msg.advisorRole} ${msg.advisorName}（${stanceLabel}）】${msg.content}`;
          })
          .join("\n")
      : "（尚无发言）";

  const lastSpeaker =
    debateHistory.length > 0 &&
    debateHistory[debateHistory.length - 1].role === "advisor"
      ? `${debateHistory[debateHistory.length - 1].advisorName}（${roleLabels[debateHistory[debateHistory.length - 1].advisorRole!] ?? debateHistory[debateHistory.length - 1].advisorRole}）`
      : "无（首轮发言）";

  const systemPrompt = prompts.COURT_DEBATE_SYSTEM_PROMPT.replace(
    "{advisors_info}",
    advisorsInfo,
  )
    .replace("{nation_name}", scenario.player_context.nation_name)
    .replace(/{leader_title}/g, scenario.player_context.leader_title)
    .replace("{current_date}", currentDateDisplay || scenario.start_date)
    .replace("{stability}", `${statLabels.stability}${stats.stability}`)
    .replace("{economy}", `${statLabels.economy}${stats.economy}`)
    .replace("{military}", `${statLabels.military}${stats.military}`)
    .replace(
      "{international_standing}",
      `${statLabels.international_standing}${stats.international_standing}`,
    )
    .replace("{situation_update}", currentSituation || "暂无特别局势变化")
    .replace("{recent_history}", recentHistory)
    .replace("{topic}", topic)
    .replace("{debate_history}", debateHistoryText)
    .replace("{last_speaker}", lastSpeaker)
    .replace("{remaining_rounds}", String(remainingRounds));

  const fullSystemPrompt = provider.supportsStructuredOutput()
    ? systemPrompt
    : systemPrompt + prompts.COURT_DEBATE_SCHEMA_PROMPT;

  const userContent =
    debateHistory.length === 0
      ? `{leader_title}提出议题："${topic}"\n\n请选择最合适的${isLife ? "同僚" : "内阁成员"}率先回应。`
      : `请根据${isLife ? "议事" : "辩论"}历史，选择下一位最合适的${isLife ? "同僚" : "内阁成员"}回应（不可与上一位发言者相同）。`;

  const messages: AIMessage[] = [
    { role: "system", content: fullSystemPrompt },
    {
      role: "user",
      content: userContent.replace(
        /{leader_title}/g,
        scenario.player_context.leader_title,
      ),
    },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: courtDebateSchema,
        temperature: 0.8,
        maxTokens: 1500,
      });

      const result = parseResponse<CourtDebateResponse>(
        response.content,
        provider,
      );

      if (!result.content?.trim()) {
        throw new Error(isLife ? "议事发言为空" : "廷议发言为空");
      }

      if (!result.speaker_role || !result.speaker_name || !result.stance) {
        throw new Error(`${isLife ? "议事" : "廷议"}响应缺少必要字段`);
      }

      if (checkObjectForSensitiveContent(result)) {
        throw new Error(
          "Generated content contains sensitive keywords, retrying...",
        );
      }

      return result;
    },
    { maxRetries: 3 },
  );
}
