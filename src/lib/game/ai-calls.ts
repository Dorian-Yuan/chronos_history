import type {
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  GameStats,
  PlayStyle,
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
  turnResultSchema,
  analysisSchema,
  counselSchema,
  courtDebateSchema,
} from "./schemas";
import { checkObjectForSensitiveContent } from "./sensitive-content";

const REQUIRED_ADVISOR_ROLES: AdvisorRole[] = [
  "General",
  "Diplomat",
  "Intel",
  "Scholar",
  "Merchant",
];

function fixInitialStats(
  stats: ScenarioData["initial_stats"],
): ScenarioData["initial_stats"] {
  const min = 200;
  const max = 320;
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

function validateScenario(data: ScenarioData): void {
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
    if (sum < 200 || sum > 320) {
      errors.push(`初始属性总和${sum}不在200-320范围内`);
    }
    const maxStat = Math.max(
      stats.stability ?? 0,
      stats.economy ?? 0,
      stats.military ?? 0,
      stats.international_standing ?? 0,
    );
    if (maxStat > 85) {
      errors.push(`单项属性${maxStat}超过85上限`);
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

  if (data.play_style === "Conquest" && Array.isArray(data.factions)) {
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
      errors.push(
        `征服模式内部势力过多（${internalFactions.length}个）：${internalFactions.map((f) => f.name).join("、")}，征服模式至多1个内部势力`,
      );
    }
  }

  if (data.play_style === "Officialdom") {
    if (!data.player_context?.official_rank) {
      errors.push("宦海模式需要official_rank品级信息");
    } else {
      if (
        data.player_context.official_rank.level < 0 ||
        data.player_context.official_rank.level > 9
      ) {
        errors.push("official_rank.level必须在0-9之间");
      }
    }
    if (!data.player_context?.superior_title?.trim()) {
      errors.push("宦海模式需要superior_title上位者头衔");
    }
    if (!data.player_context?.superior_name?.trim()) {
      errors.push("宦海模式需要superior_name上位者姓名");
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
          `派系"${faction.name}"的attitude值"${faction.attitude}"不合法，只能取：${VALID_ATTITUDES.join("、")}`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`回合结果验证失败: ${errors.join("; ")}`);
  }

  if (data.player_context_update) {
    if (!data.player_context_update.change_reason?.trim()) {
      throw new Error("player_context_update requires change_reason");
    }
    if (
      data.player_context_update.nation_name !== undefined &&
      !data.player_context_update.nation_name.trim()
    ) {
      throw new Error("player_context_update.nation_name cannot be empty");
    }
    if (
      data.player_context_update.leader_title !== undefined &&
      !data.player_context_update.leader_title.trim()
    ) {
      throw new Error("player_context_update.leader_title cannot be empty");
    }
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

const JSON_OUTPUT_INSTRUCTION = `\n\n【输出格式】你必须只返回纯 JSON 对象，不要包含任何其他文字、解释、注释或 markdown 标记（如 \`\`\`json）。直接以 { 开头，以 } 结尾。`;

const SCENARIO_CORE_SCHEMA_PROMPT = `

【输出 JSON 结构——阶段1：核心设定】你必须严格按以下结构返回JSON：
{
  "id": "唯一标识字符串",
  "title": "4字中文标题",
  "description": "匿名化的情境描述（200-400字）",
  "player_context": {
    "nation_name": "玩家国家/派系名称",
    "leader_title": "玩家头衔（如皇帝、国王、执政官、总督、大公、首相、摄政王、城邦领主等。Officialdom模式为官员头衔如县令、侍郎等）",
    "background_summary": "背景简介（100-200字）",
    "official_rank": { "level": 数字(0-9,0=超品), "title": "官职名称", "department": "所属部门", "is_military": 布尔值 }（Officialdom模式必填，其他模式不填）,
    "superior_title": "上位者头衔（如皇帝、大将军，Officialdom模式必填，其他模式不填）",
    "superior_name": "上位者姓名（Officialdom模式必填，其他模式不填）"
  },
  "initial_stats": {
    "stability": 数字(0-100),
    "economy": 数字(0-100),
    "military": 数字(0-100),
    "international_standing": 数字(0-100)
  },
  "hidden_real_event": "真实历史事件名称",
  "play_style": "Conquest或Prosperity或Reform或Survival或Officialdom",
  "start_date": "中文日期字符串（风格与时代一致，如中国朝代用年号格式）"
}`;

const SCENARIO_DETAILS_SCHEMA_PROMPT = `

【输出 JSON 结构——阶段2：顾问与派系】你必须严格按以下结构返回JSON：
{
  "initial_advisors": [
    {
      "role": "General",
      "name": "真实人名（禁止奇幻风格，中国用姓+名，欧洲用名+姓，必须全为中文）",
      "advice": "建议（简体中文）",
      "bias": "倾向（前4字为核心总结，共15字以内，如'主战派：主张以武力解决'）"
    },
    { "role": "Diplomat", ... },
    { "role": "Intel", ... },
    { "role": "Scholar", ... },
    { "role": "Merchant", ... }
  ],
  "factions": [
    {
      "name": "2字势力简称（必须真实可信，禁止奇幻风格如'暗影''血月'）",
      "leader": "势力领袖姓名（与顾问命名规则一致，禁止奇幻风格）",
      "description": "势力描述（Conquest以外国势力为主，Prosperity以经济集团为主，Reform以内部政治力量为主，Survival内外兼有，Officialdom以朝堂内部派系为主）",
      "strength": "主要优势",
      "weakness": "关键弱点",
      "needs": "急需什么",
      "attitude": "当前立场（只能取：敌对、求和、中立、友好、臣服，禁止其他值）"
    }
  ],
  "initial_decision_options": [
    { "title": "选项标题（2-6字）", "description": "选项简述（30-60字）", "recommended_advisor": "推荐顾问角色名（如'将军'）" }
  ]
}`;

const TURN_SCHEMA_PROMPT = `

【输出 JSON 结构】你必须严格按以下结构返回JSON：
{
  "narrative": "用户行动的直接后果（200-500字）",
  "situation_update": "新挑战/危机",
  "date_display": "当前相对日期",
  "headline": "报纸/诏令标题",
  "rumor": "民间流言",
  "historian_commentary": "史官注疏（文言或半文言，50-100字，暗含褒贬，偶尔暗示未来）",
  "stats_delta": {
    "stability": 数字(-10到10),
    "economy": 数字(-10到10),
    "military": 数字(-10到10),
    "international_standing": 数字(-10到10)
  },
  "advisors": [
    {
      "role": "General或Diplomat或Intel或Scholar或Merchant",
      "name": "顾问名",
      "advice": "建议",
      "bias": "倾向（前4字为核心总结，共15字以内，如'主战派：主张以武力解决'）",
      "hidden_motive": "秘密动机",
      "status": "active或dead或exiled或retired（仅当该顾问本回合发生变故时填写，否则默认active）"
    }
  ],
  "factions_update": [
    {
      "name": "派系名",
      "description": "描述",
      "strength": "优势",
      "weakness": "弱点",
      "needs": "需求",
      "attitude": "立场（只能取：敌对、求和、中立、友好、臣服，禁止其他值）",
      "is_new": 布尔值,
      "is_destroyed": 布尔值,
      "leader": "领袖姓名（必须与上一回合保持一致，除非满足更换条件）",
      "leader_status": "active或dead或exiled或overthrown（仅当领袖本回合发生变故时填写，否则默认active）"
    }
  ],
  "hidden_consequences": "回合总结（AI长期记忆）",
  "decision_options": [
    { "title": "选项标题（2-6字）", "description": "选项简述（30-60字）", "recommended_advisor": "推荐顾问角色名（如'将军'）" }
  ],
  "is_game_over": 布尔值,
  "game_over_reason": "结束原因（如未结束则为空字符串）",
  "player_context_update": {
    "nation_name": "新国名（仅政权根本性变更时填写，否则省略此字段）",
    "leader_title": "新头衔（仅身份根本性变化时填写，否则省略此字段）",
    "background_summary": "新背景概述（仅重大变故时填写，否则省略此字段）",
    "change_reason": "变更原因（必填，简述原因）",
    "official_rank": { "level": 数字(0-9), "title": "新官职", "department": "新部门", "is_military": 布尔值 },
    "superior_title": "新上位者头衔（上位者更替时填写）",
    "superior_name": "新上位者姓名（上位者更替时填写）"
  }
}`;

const ANALYSIS_SCHEMA_PROMPT = `

【输出 JSON 结构】你必须严格按以下结构返回JSON：
{
  "real_event_title": "真实历史事件名称",
  "real_outcome_summary": "真实历史的结果",
  "user_outcome_summary": "玩家时间线的结果",
  "comparison_text": "对比分析",
  "similar_historical_figure": "相似历史人物",
  "persona_title": "统治者画像标题",
  "persona_description": "画像描述",
  "radar_stats": [
    { "dimension": "Authority", "value": 数字(0-100), "fullMark": 100 },
    { "dimension": "Strategy", "value": 数字(0-100), "fullMark": 100 },
    { "dimension": "Empathy", "value": 数字(0-100), "fullMark": 100 },
    { "dimension": "Vision", "value": 数字(0-100), "fullMark": 100 },
    { "dimension": "Economy", "value": 数字(0-100), "fullMark": 100 }
  ],
  "turn_reviews": [
    { "turn": 回合数, "summary": "决策摘要", "commentary": "战略点评" }
  ],
  "modern_echo": "从2026年现代视角回望玩家统治的历史影响（100-200字）",
  "alternative_history": "推演玩家统治下该国未来50年的蝴蝶效应发展路径（200-400字）"
}`;

const SCENARIO_SYSTEM_PROMPT = `你是Chronos历史推演引擎的剧本生成器。根据玩家选择的执政基调，生成一个历史决策推演剧本。

【语言规则——最高优先级】
所有文本字段必须使用简体中文，禁止英文（JSON字段名和play_style枚举值除外）。

【硬性约束清单】
1. title：4个中文字
2. leader_title：与时代匹配的头衔（皇帝/国王/执政官/总督/大公/首相/摄政王/城邦领主等，Officialdom模式为官员头衔如县令/侍郎/尚书等），禁止"可汗""大汗""汗"
3. 多样性：50%中国封建王朝（清之前）、50%其他文明，优先冷门时期
4. 禁止背景：蒙古汗国/草原汗国/游牧帝国/三国/楚汉争霸/安史之乱
5. 人名规范：全部虚构，禁止真实历史人物名，禁止奇幻风格（"铁牙""影爪""苍狼"等），按文明传统命名：
   - 中国：姓+名（如"陈伯年"风格）
   - 日本：姓+名
   - 欧洲：名+姓中文译名
   - 中东：名+父名中文译名
6. 派系名：真实可信，禁止"暗影""血月""苍狼"等奇幻风格
7. 命名一致性：同一剧本内所有名字遵循单一文化风格
8. 时代一致性：技术、武器、概念符合历史时代
9. 内容限制：禁止1949年后中国大陆政治事件、领土主权争议
10. initial_stats总和200-320，单项≤85
11. 3-4个初始派系，每个含leader字段
12. 5个初始顾问（General/Diplomat/Intel/Scholar/Merchant各一）
13. hidden_real_event：真实历史事件名称（玩家不可见）
14. start_date：中文日期格式，与时代风格一致
15. 2-3个initial_decision_options，作为玩家第一回合决策选项

执政基调：
- Conquest（铁血征服）：军事冲突与版图扩张，初始military较高
- Prosperity（商贸繁荣）：经济建设与贸易垄断，初始economy较高
- Reform（文明变革）：政治改革、文化与外交，初始stability较高
- Survival（绝境求生）：崩溃边缘，初始属性40-55，总和偏低，多重危机
- Officialdom（宦海沉浮）：以臣子之身行走朝堂，初始品级5-7品，初始属性30-50，总和偏低。玩家不是最高统治者，而是官僚体系中的一员。必须生成official_rank（品级信息）、superior_title（上位者头衔如皇帝/大将军）、superior_name（上位者姓名）。leader_title为官员头衔（如县令/侍郎），而非统治者头衔。派系以朝堂内部派系为主（如清流党/外戚派/武将集团等），至少3个内部派系，禁止纯外部入侵者派系。与其他模式一样，50%概率中国封建王朝（清朝之前）、50%概率其他文明，不局限于中国古代

【派系规则——按基调严格区分】
- Conquest：4个派系中至少3个外部敌对势力，内部至多1个。禁止以内部政治派系为主
- Prosperity：经济利益集团和贸易伙伴/竞争对手为主，禁止纯军事入侵者
- Reform：改革vs保守内部力量为主（至少3个内部），外部至多1-2个
- Survival：至少2个内部+至少1个外部，内外交困
- Officialdom：派系全部为朝堂内部派系（至少3个），代表不同的政治利益集团。态度值映射：敌对→打压/忌惮，求和→利用，中立→观望，友好→提携/拉拢，臣服→依附

【生成后自检——极其重要】
返回JSON前，逐项检查：
1. title是否4个中文字？
2. leader_title是否不是"可汗""大汗""汗"？
3. 人名是否全部虚构且符合文明命名传统？无奇幻风格？
4. 派系构成是否符合基调要求？
5. initial_stats总和是否200-320？单项是否≤85？
6. 是否有5个顾问且角色齐全？
7. 是否有3-4个派系且每个有leader字段？
8. 是否有2-3个initial_decision_options？
9. 所有文本字段是否为简体中文？
10. 若为Officialdom模式，是否包含official_rank、superior_title、superior_name？
不通过则修正后再输出${JSON_OUTPUT_INSTRUCTION}`;

export async function generateScenario(
  playStyle: PlayStyle,
  userHint?: string,
  onProgress?: (stage: string) => void,
): Promise<ScenarioData> {
  const provider = getProvider();

  const structuredOutputSupported = provider.supportsStructuredOutput();
  console.log(
    "[generateScenario] provider:",
    provider.id,
    "supportsStructuredOutput:",
    structuredOutputSupported,
  );

  const userContent = `执政基调：${playStyle}\n\n请以50%概率选择中国封建王朝（清朝之前）、50%概率选择其他文明。优先选择冷门时期，绝对禁止选择三国、楚汉等大热门，绝对禁止草原汗国/游牧帝国背景。所有人物名必须是虚构的，不能使用真实历史人物名。${userHint ? `\n\n【玩家自定义要求——极其重要，必须重点参考】\n${userHint}\n\n你必须在生成剧本时重点考虑以上玩家要求，将其融入剧本的文明选择、年代设定、玩家身份和剧情走向中。如果玩家指定了具体文明或年代，优先遵从；如果玩家指定了身份，必须据此设定player_context；如果玩家描述了大致剧情，必须将其作为description的核心内容。` : ""}`;

  // Stage 1: Core settings
  onProgress?.("正在构思历史背景...");
  const coreSystemPrompt = structuredOutputSupported
    ? SCENARIO_SYSTEM_PROMPT
    : SCENARIO_SYSTEM_PROMPT + SCENARIO_CORE_SCHEMA_PROMPT;

  const coreResult = await withRetry(
    async () => {
      const response = await provider.sendMessage(
        [
          { role: "system", content: coreSystemPrompt },
          { role: "user", content: userContent },
        ],
        {
          responseFormat: "json",
          responseSchema: scenarioCoreSchema,
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

  // Stage 2: Advisors & Factions
  onProgress?.("正在招募顾问与评估势力...");
  const detailsSystemPrompt = `你是Chronos历史推演引擎的顾问与派系生成器。根据已确定的核心设定，生成顾问和派系。

【语言规则】所有文本字段必须使用简体中文。

【硬性约束】
1. 5个顾问（General/Diplomat/Intel/Scholar/Merchant各一）
2. 3-4个派系，每个含leader字段
3. 人名全部虚构，禁止奇幻风格，按文明传统命名
4. 派系名真实可信，禁止奇幻风格
5. 2-3个initial_decision_options
6. 派系构成须符合基调：Conquest至少3外部，Prosperity经济集团为主，Reform至少3内部，Survival内外兼有，Officialdom全部为朝堂内部派系（至少3个）
7. 派系attitude只能取：敌对、求和、中立、友好、臣服，禁止其他值

【生成后自检】
1. 是否5个顾问且角色齐全？
2. 是否3-4个派系且每个有leader？
3. 人名是否符合文明传统？无奇幻风格？
4. 派系构成是否符合基调？
5. 是否有2-3个initial_decision_options？
6. 派系attitude是否为5个合法值之一（敌对、求和、中立、友好、臣服）？
不通过则修正后再输出${JSON_OUTPUT_INSTRUCTION}`;

  const detailsSchemaPrompt = structuredOutputSupported
    ? ""
    : SCENARIO_DETAILS_SCHEMA_PROMPT;

  const officialdomInfo =
    coreResult.play_style === "Officialdom" &&
    coreResult.player_context?.official_rank
      ? `\n- 品级：${coreResult.player_context.official_rank.level === 0 ? "超品" : `${coreResult.player_context.official_rank.level}品`}${coreResult.player_context.official_rank.title}（${coreResult.player_context.official_rank.department}）\n- 上位者：${coreResult.player_context.superior_title || ""} ${coreResult.player_context.superior_name || ""}`
      : "";

  const detailsUserContent = `核心设定：
- 标题：${coreResult.title}
- 国家：${coreResult.player_context?.nation_name}
- 领袖头衔：${coreResult.player_context?.leader_title}
- 背景：${coreResult.player_context?.background_summary}
- 执政基调：${coreResult.play_style}
- 描述：${coreResult.description}${officialdomInfo}

请生成顾问、派系和初始决策选项。`;

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
        ),
        hidden_real_event: coreResult.hidden_real_event || "",
        play_style: coreResult.play_style || playStyle,
        start_date: coreResult.start_date || "",
        initial_advisors: detailsResult.initial_advisors || [],
        factions: detailsResult.factions || [],
        initial_decision_options: detailsResult.initial_decision_options,
      };

      const fixedScenario = fixInternalFactions(merged);

      if (fixedScenario.factions.length < 3) {
        throw new Error(
          `修复内部势力后派系仅剩${fixedScenario.factions.length}个，不足3个，需重新生成`,
        );
      }

      validateScenario(fixedScenario);

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

const ROLE_LABELS: Record<AdvisorRole, string> = {
  General: "将军",
  Diplomat: "外交官",
  Intel: "密探",
  Scholar: "学者",
  Merchant: "商人",
};

const COUNSEL_SYSTEM_PROMPT = `你是Chronos历史推演引擎的问对密谈系统。你将扮演一位内阁顾问，与国君进行私下一对一密谈。

【核心规则】
1. 这是一次私密的、非正式的对话，只有你和国君两人在场，无旁人知晓
2. 在私下场合，你可以比朝堂上更坦率、更直接地表达看法
3. 你可以透露一些在公开场合不便说出的信息、猜测或担忧
4. 但你的回应仍需符合你的角色立场和性格倾向
5. 回应控制在100-200字，言简意赅，像私下对话而非正式奏折
6. 必须使用简体中文

【角色信息】
你的名字：{advisor_name}
你的职位：{role_label}（{role}）
你的性格倾向：{bias}
你的秘密动机：{hidden_motive}

【当前局势】
国家：{nation_name}
国君：{leader_title}
当前属性：稳定{stability} 经济{economy} 军事{military} 声望{international_standing}
当前局势：{situation_update}
近期历史：{recent_history}

【回应要求】
- 以该顾问面对{leader_title}时符合身份的口吻回应
- 体现你在该角色立场上的专业判断
- 体现私下场合的坦诚程度（可能比公开场合更直接、更具体）
- 你的个人倾向和隐藏动机应微妙地影响你的建议
- Officialdom模式下：顾问是同僚/幕僚而非下属，以同僚口吻交流，禁止使用"陛下""圣上""臣"等君臣用语，可用"大人""阁下""下官"等

【语言与时代约束——极其重要】
回应的语言风格必须严格符合当前剧本的历史文化时代：
- 中国古代朝代：可以使用"臣以为""依臣之见"等符合身份的用语，但不必过于拘谨
- 欧洲/西方文明：使用符合宫廷/私下场合风格的译法，如"陛下""我认为"等，禁止使用"臣以为""微臣"等中国朝堂用语
- 日本/中东/其他文明：使用符合该文化风格的用语
- 核心原则：让玩家感觉身临其境，绝不出戏${JSON_OUTPUT_INSTRUCTION}`;

const COUNSEL_SCHEMA_PROMPT = `

【输出 JSON 结构——极其重要】无论对话进行多少轮，你每次回复都必须严格按以下JSON格式返回，绝对不能返回任何非JSON内容：
{
  "response": "顾问的私下回应（简体中文，100-200字）"
}
注意：
- 不要输出任何JSON以外的内容
- 不要包含markdown标记（如\`\`\`json）、注释或解释文字
- 不要在JSON前后添加任何额外文本`;

export async function counselAdvisor(
  advisor: AdvisorData,
  scenario: ScenarioData,
  stats: GameStats,
  historyLog: string[],
  currentSituation: string,
  conversationHistory: CounselMessage[],
): Promise<string> {
  const provider = getProvider();

  const roleLabel = ROLE_LABELS[advisor.role] || advisor.role;
  const recentHistory =
    historyLog.length > 0
      ? historyLog
          .slice(-2)
          .map((h, i) => `回合${historyLog.length - 1 + i}: ${h}`)
          .join("\n")
      : "（无）";

  const systemPrompt = COUNSEL_SYSTEM_PROMPT.replace(
    "{advisor_name}",
    advisor.name,
  )
    .replace("{role_label}", roleLabel)
    .replace("{role}", advisor.role)
    .replace("{bias}", advisor.bias)
    .replace("{hidden_motive}", advisor.hidden_motive || "无")
    .replace("{nation_name}", scenario.player_context.nation_name)
    .replace("{leader_title}", scenario.player_context.leader_title)
    .replace("{stability}", String(stats.stability))
    .replace("{economy}", String(stats.economy))
    .replace("{military}", String(stats.military))
    .replace("{international_standing}", String(stats.international_standing))
    .replace("{situation_update}", currentSituation || "暂无特别局势变化")
    .replace("{recent_history}", recentHistory)
    .replace(/{leader_title}/g, scenario.player_context.leader_title);

  const fullSystemPrompt = provider.supportsStructuredOutput()
    ? systemPrompt
    : systemPrompt + COUNSEL_SCHEMA_PROMPT;

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

const TURN_SYSTEM_PROMPT = `你是Chronos历史推演引擎的回合评估器。根据玩家的行动，评估后果并推进历史进程。

【语言规则——最高优先级】
所有文本字段必须使用简体中文，禁止英文（JSON字段名除外）。

【时间推进】
- 基于上下文中的"初始纪年"和"当前纪年"推进，禁止回退或跳变
- 激烈事件推进数天到数月，常规推进数月到半年，和平推进半年到数年
- date_display格式与初始纪年保持同一文化风格，禁止英文
- 年号变动需叙事理由，禁止无故更换

【可行性检查】
| 属性阈值 | 限制 |
|---------|------|
| military<20 | 只能防守，军事行动可能哗变 |
| military<30 | 不能进攻，只能防御 |
| military<50 | 不能多线作战 |
| economy<20 | 国库枯竭，无法启动任何项目 |
| economy<30 | 不能资助大型项目 |
| economy<50 | 不能维持长期战争 |
| stability<20 | 任何行动可能触发政变/分裂 |
| stability<30 | 改革失败率极高 |
| stability<50 | 不能激进改革 |
| international_standing<20 | 外交渠道关闭 |
| international_standing<30 | 外交倡议被无视 |
| international_standing<50 | 只能双边谈判 |

【属性变化与难度缩放】
| 回合阶段 | 属性范围 | 特点 |
|---------|---------|------|
| 1-4回合（早期保护）| -5到+8 | 温和，不会降到0 |
| 5-8回合（艰难期）| -10到+8 | 偏负值，危机频发 |
| 9-15回合（过渡期）| -10到+10 | 趋于中性 |
| 16+回合（稳定期）| -6到+10 | 偏正值，国家趋稳 |

属性硬性范围0-100，超出部分自动截断无效。

基调缩放：Survival最严酷（偏负值），Conquest军事高方差，Reform改革需多回合见效，Prosperity经济缓慢稳定

后期加速（16+回合）：
- 叙事节奏加快：时间推进跨度增大（前期时间的3-5倍），多重大事件同时推进
- decision_options须包含至少1个"收束性选项"（如：巩固成果、战略收缩、寻求和平等）
- 若属性全部>70且无活跃敌对派系，应主动在narrative中暗示历史进入收束阶段
- 20+回合后，若国家已稳定（属性均值>65且无属性<50），is_game_over应相对倾向为true
- 禁止后期反复拉扯：已解决的危机不得无故复燃，已臣服的派系不得反复叛乱，避免让玩家陷入微操细节。后期应聚焦大方向抉择而非反复处理同一问题

【游戏时长与结束条件】8-28回合。
结束条件（满足任一即结束）：
1. 回合硬上限：超过28回合强制结束
2. 国家崩溃：任何属性降到10以下（≤10），且已过8回合
3. AI裁决：is_game_over=true，且已过8回合
4. 完美胜利：所有属性达到95以上（≥95）

is_game_over设置规则：
- 8回合前：必须为false
- 9-15回合：仅在极端/统一/危机化解/玩家要求时可设为true
- 16-20回合：若国家已基本稳定（属性均值>65且无属性<50）或主要矛盾已化解，可设为true
- 20+回合：若国家稳定且无重大危机，应倾向设为true
- 28回合：必须设为true

【叙事要求】
- narrative：200-500字，生动有画面感
- situation_update：新挑战/危机
- headline：简洁有力
- rumor：民间流言，暗示潜在危机
- historian_commentary：史官注疏，文言/半文言，50-100字，春秋笔法，偶尔暗示未来，禁止剧透
- decision_options：2-3个，涵盖不同方向，含陷阱选项，recommended_advisor须是5位顾问之一
- hidden_consequences：AI长期记忆，必须记录派系镇压累积次数、态度变化节点、玩家持续政策、未解决隐患、玩家政策的取消/变更

【稳定性总则——极其重要】
顾问稳定性：
- 顾问name一旦确定不可随意更换
- 仅在死亡/叛国/叛逃/致仕（8回合后）时可换，须叙事交代
- 未更换时必须与"当前顾问名单"一致
- 顾问发生变故时，须在advisors数组中将该顾问的status设为对应值（dead/exiled/retired），同时在该role下新增一位继任顾问（status为active）
- 例：将军战死 → 原将军status设为"dead"，新增一位将军（不同name，status为"active"）

派系领袖稳定性：
- leader一旦确定不可随意更换
- 仅在派系被消灭/内部政变/新增势力时可换，须叙事交代
- 未更换时必须与"当前派系"一致
- 领袖发生变故时，须在factions_update中将leader_status设为对应值（dead/exiled/overthrown），同时更新leader为新领袖名

派系态度锁定：
- attitude只能取以下5个值之一：敌对、求和、中立、友好、臣服。禁止使用其他任何值（如"即将归附""倾向臣服""表面臣服"等均不允许）
- 派系被消灭时（is_destroyed=true），attitude填"臣服"，代码会自动标记为"已灭亡"
- 臣服→敌对：禁止直接跳转，须至少2回合过渡
- 臣服叛乱条件（须同时满足）：stability<50 + 连续2回合忽视 + 前8回合绝对不可叛乱
- 敌对→臣服：须"敌对→求和→中立→友好→臣服"渐进3-4回合
- 清理效果累积：第1次臣服（表面归顺），第2次大幅削弱，第3次+可消灭
- 活跃派系总数≤6
- 后期简化：16+回合后，已臣服派系不得反复叛乱，已解决的派系冲突应保持稳定

【政策延续性——极其重要】
- 玩家每回合的行动即为当回合政策，无持续性命令系统
- 若玩家明确取消/变更之前的政策，必须在hidden_consequences中明确标注"XX政策已取消"或"XX政策已变更为YY"
- 后续回合不得再提及或执行已取消的政策，除非叙事需要交代善后收尾
- 禁止假设玩家有未声明的持续性政策
- 近期玩家行动中若有与历史政策矛盾的指令，以最新指令为准，旧政策自动失效

【玩家身份变更——极其谨慎】
player_context_update字段用于记录玩家身份/国号的根本性变化，极其重要且必须谨慎：
- 绝大多数回合：不填写此字段（null/省略），保持身份稳定
- 仅在以下重大历史节点方可变更：
  1. nation_name变更条件（满足任一）：
     - 改朝换代/建立新朝
     - 国家被吞并后以新名称存续
     - 革命/政变后建立新政体并改国号
     - 绝对禁止：普通外交事件、暂时性领土变化、年号变更
  2. leader_title变更条件（满足任一）：
     - 称帝/封王/即位等身份跃升
     - 被俘/被废/降级等身份跌落
     - 政体变更导致头衔体系变化（如君主制→共和制，皇帝→总统）
     - 绝对禁止：普通升迁、暂时性代职、荣誉性加衔
  3. background_summary变更条件：
     - 仅在nation_name或leader_title变更时同步更新
- change_reason必须简明扼要说明变更原因
- 8回合内禁止任何变更（国家初建，根基未稳）
- 同一游戏内nation_name最多变更2次，leader_title最多变更3次
- 变更后的头衔必须与当前历史文化时代匹配
- Officialdom模式下，official_rank变更条件：
  - 升迁：圣眷+威望双高时可能升迁，每次最多升1-2品，需叙事理由
  - 降职：可一次降多品，需叙事理由（获罪、失宠、派系斗争失败）
  - 超品(0)：仅在极端条件下可达（如幼主即位时被任命为摄政）
  - superior_title/superior_name变更：上位者更替时（如老皇帝驾崩新帝即位）

【宦海沉浮模式特殊规则】
当执政基调为Officialdom时，以下规则覆盖默认规则：
1. 玩家身份：玩家是品级官员，不是最高统治者。所有决策须在品级权限范围内
2. 上位者：当前上位者由superior_title和superior_name指定，圣眷（international_standing）决定上位者态度
3. 品级限制：
   - 七品及以下：只能影响地方事务，不能直接参与朝政决策
   - 五品至六品：可参与部分朝政讨论，但无决策权
   - 三品至四品：可提出政策建议，有一定决策权
   - 一品至二品：可主导国策方向
   - 超品：近乎最高统治者权限
4. 圣眷机制：
   - 圣眷>70：上位者信任，可获特权
   - 圣眷50-70：正常君臣关系
   - 圣眷30-50：上位者猜忌，行动受限
   - 圣眷<30：随时可能被贬/被杀
   - 圣眷<15：几乎必死，除非有强力外力干预
5. 升迁条件：圣眷+威望双高时可能升迁；立大功可破格提拔
6. 降职/获罪条件：圣眷过低、派系斗争失败、触怒上位者
7. 特殊事件：弹劾、举荐、密旨、党争、夺嫡等宦海特有事件
8. 顾问称呼：顾问是同僚/幕僚，不是下属。密谈时以同僚口吻交流
9. 廷议称呼：廷议改为"议事"，发言者是同僚，称呼玩家时用官职而非"陛下"
10. 游戏结束条件：
    - 胜利：升至超品/一品 且 威望+圣眷均>70
    - 存续：品级稳定在三品以上
    - 失败：被处决/流放/圣眷归零
11. 难度缩放：1-4回合（适应期-3到+6），5-8回合（暗流期-8到+6），9-15回合（风浪期-10到+8），16+回合（定局期-6到+10）

【生成后自检——极其重要】
返回JSON前，逐项检查：
1. 顾问name是否与"当前顾问名单"一致（除非满足极端更换条件）？
2. 派系leader是否与"当前派系"一致（除非满足更换条件）？
3. decision_options是否有2-3个且各不相同？
4. stats_delta每项是否在-10到10之间？
5. historian_commentary是否为文言/半文言风格，50-100字？
6. 所有文本字段是否为简体中文？
7. factions_update中每个派系的attitude是否为5个合法值之一（敌对、求和、中立、友好、臣服）？
8. player_context_update是否仅在重大历史节点时填写？change_reason是否合理？
9. 若填写了player_context_update，变更后的nation_name/leader_title是否与历史文化时代匹配？
不通过则修正后再输出${JSON_OUTPUT_INSTRUCTION}`;

export async function evaluateTurn(
  scenario: ScenarioData,
  historyLog: string[],
  userAction: string,
  currentStats: GameStats,
  turnCount: number,
  currentAdvisors?: { role: string; name: string }[],
  currentDateDisplay?: string,
  recentPlayerActions?: string[],
): Promise<TurnResult> {
  const provider = getProvider();

  const systemPrompt = provider.supportsStructuredOutput()
    ? TURN_SYSTEM_PROMPT
    : TURN_SYSTEM_PROMPT + TURN_SCHEMA_PROMPT;

  const recentActionsSection =
    recentPlayerActions && recentPlayerActions.length > 0
      ? `\n近期玩家行动（以最新为准，旧行动若与新行动矛盾则已自动失效）：\n${recentPlayerActions.map((a, i) => `- 回合${turnCount - recentPlayerActions.length + i}：${a}`).join("\n")}\n`
      : "";

  const officialdomSection =
    scenario.play_style === "Officialdom" &&
    scenario.player_context.official_rank
      ? `\n玩家品级：${scenario.player_context.official_rank.level === 0 ? "超品" : `${scenario.player_context.official_rank.level}品`}${scenario.player_context.official_rank.title}（${scenario.player_context.official_rank.department}，${scenario.player_context.official_rank.is_military ? "武职" : "文职"}）
上位者：${scenario.player_context.superior_title || "皇帝"} ${scenario.player_context.superior_name || "未知"}`
      : "";

  const contextMessage = `当前剧本：${scenario.title}
玩家国家：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}
执政基调：${scenario.play_style}
初始纪年：${scenario.start_date}
当前纪年：${currentDateDisplay || scenario.start_date}
当前回合：第${turnCount}回合${officialdomSection}

当前属性：
- 稳定性(stability)：${currentStats.stability}
- 经济(economy)：${currentStats.economy}
- 军事(military)：${currentStats.military}
- 国际声望(international_standing)：${currentStats.international_standing}

当前顾问名单（必须保持一致，除非满足极端更换条件）：
${currentAdvisors && currentAdvisors.length > 0 ? currentAdvisors.map((a) => `- ${a.role}：${a.name}`).join("\n") : scenario.initial_advisors.map((a) => `- ${a.role}：${a.name}`).join("\n")}

历史日志（AI长期记忆）：
${historyLog.length > 0 ? historyLog.map((h, i) => `回合${i + 1}: ${h}`).join("\n") : "（无）"}
${recentActionsSection}
当前派系：
${scenario.factions.map((f) => `- ${f.name}（领袖：${f.leader || "未知"}，${f.attitude}）：${f.description}`).join("\n")}

玩家行动：${userAction}`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: contextMessage },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: turnResultSchema,
        temperature: 0.8,
        maxTokens: 4096,
      });

      const result = parseResponse<TurnResult>(response.content, provider);

      validateTurnResult(result);

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

const ANALYSIS_SYSTEM_PROMPT = `你是Chronos历史推演引擎的结局分析师。游戏结束后，生成详细的分析报告。

【语言规则——最高优先级】
你返回的JSON中，所有文本字段（real_event_title、real_outcome_summary、user_outcome_summary、comparison_text、similar_historical_figure、persona_title、persona_description、turn_reviews中的summary和commentary）必须全部使用简体中文，绝对禁止出现任何英文单词、英文缩写、英文人名。唯一例外是JSON结构本身的英文字段名和radar_stats中的dimension枚举值（Authority/Strategy/Empathy/Vision/Economy）。

【条件结局信息——极其重要】
系统已根据玩家的执政基调、属性状态、派系态势和回合数，判定了一个条件结局。你必须根据这个条件结局来生成分析报告，使persona_title和persona_description与条件结局保持一致：
- 条局结局标题：{conditional_outcome_title}
- 条件结局描述：{conditional_outcome_description}
- 条件结局基础判定：{conditional_outcome_base}
你的persona_title应与条件结局标题呼应，persona_description应结合条件结局描述和玩家具体决策给出个性化评价。

要求：
1. real_event_title：揭示剧本所基于的真实历史事件名称
2. real_outcome_summary：真实历史的结果
3. user_outcome_summary：玩家时间线的结果
4. comparison_text：对比分析，指出玩家决策与历史走向的异同
5. similar_historical_figure：与玩家决策风格最相似的历史人物
6. persona_title：根据条件结局和玩家全程经历，匹配最接近的统治者画像标题。须与条件结局标题"{conditional_outcome_title}"呼应
7. persona_description：画像描述，结合条件结局描述和玩家具体决策给出个性化评价
8. radar_stats：5维雷达图数据（Authority/Strategy/Empathy/Vision/Economy），每项0-100
9. turn_reviews：每回合的决策复盘，包含summary和commentary。commentary必须兼顾正反两面——先肯定玩家在该回合做得好的决策，再指出不足之处或可以改进的地方。不要只批评也不只赞美，要像一位既欣赏学生才华又严格要求的导师
10. modern_echo：从现代（2026年）视角回望玩家统治的历史影响。例如："在2026年的博物馆里，史学家们仍在争论你在某次战役中的决策……"或"千年之后，你的统治方式仍被政治学者引用为经典案例……"。从几千年后回望的视角，让玩家感到自己真的改变了历史轨迹。100-200字，简体中文，不要按照示例写，请自行发挥
11. alternative_history：推演在玩家的统治决策影响下，这个国家未来50年的"蝴蝶效应"发展路径。基于玩家的具体决策风格和最终属性，描绘一个连贯的未来叙事。例如：如果玩家偏向军事扩张，推演该国如何成为军事帝国并最终走向何方；如果玩家偏向经济繁荣，推演商业文明如何演变。200-400字，简体中文${JSON_OUTPUT_INSTRUCTION}`;

export async function analyzeGame(
  scenario: ScenarioData,
  historyLog: string[],
  conditionalOutcome?: { title: string; description: string; base: string },
): Promise<EndGameAnalysis> {
  const provider = getProvider();

  const outcomeTitle = conditionalOutcome?.title || "存续之主";
  const outcomeDescription =
    conditionalOutcome?.description || "不好不坏的统治。";
  const outcomeBase = conditionalOutcome?.base || "neutral";
  const baseLabel =
    outcomeBase === "victory"
      ? "胜利"
      : outcomeBase === "defeat"
        ? "失败"
        : "存续";

  let systemPrompt = ANALYSIS_SYSTEM_PROMPT;
  if (!provider.supportsStructuredOutput()) {
    systemPrompt += ANALYSIS_SCHEMA_PROMPT;
  }

  systemPrompt = systemPrompt
    .replace(/{conditional_outcome_title}/g, outcomeTitle)
    .replace(/{conditional_outcome_description}/g, outcomeDescription)
    .replace(/{conditional_outcome_base}/g, baseLabel);

  const contextMessage = `剧本：${scenario.title}
真实历史事件：${scenario.hidden_real_event}
玩家国家：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}
执政基调：${scenario.play_style}

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

const COURT_DEBATE_SYSTEM_PROMPT = `你是Chronos历史推演引擎的廷议辩论系统。你负责模拟内阁成员在朝堂上的公开辩论。

【核心规则】
1. 每次只有一位内阁成员发言，由你根据议题和当前辩论内容选择最合适的发言人
2. 选择标准：与当前议题/上一次发言关联度最高的成员，或最有理由驳斥/补充的成员
3. 发言人不能连续发言（上一位发言者不可立即再次发言）
4. 回应必须体现该角色的立场、倾向和秘密动机
5. 秘密动机是每个人内心的真实想法，其他人并不知道——但在公开辩论中，秘密动机会微妙地影响发言倾向，而不会直接暴露
6. 每次发言必须明确表态：支持、驳斥或补充上一位发言者（首轮对玩家议题表态）
7. 发言控制在80-150字，言简意赅，像朝堂奏对而非私下闲聊
8. 必须使用简体中文

【语言与时代约束——极其重要】
发言的语言风格必须严格符合当前剧本的历史文化时代：
- 中国古代朝代：使用文言或半文言，如"臣以为""启奏陛下""微臣愚见"等
- 欧洲/西方文明：使用符合宫廷/议会风格的译法，如"陛下""我认为""据我所知"等，绝对禁止使用"臣以为""微臣"等中国朝堂用语
- 日本/中东/其他文明：使用符合该文化朝堂风格的用语
- 核心原则：让玩家感觉身临其境，绝不出戏

【内阁成员信息】
{advisors_info}

【当前局势】
国家：{nation_name}
国君：{leader_title}
当前纪年：{current_date}
当前属性：稳定{stability} 经济{economy} 军事{military} 声望{international_standing}
当前局势：{situation_update}
近期历史：{recent_history}

【辩论议题】
{topic}

【辩论历史】
{debate_history}

【上一位发言者】
{last_speaker}

【剩余轮数】
还剩{remaining_rounds}轮辩论

【回应要求】
- 选择最合适的发言人（不可与上一位相同）
- 体现角色在公开场合的立场（可能与私下密谈不同，公开场合更谨慎/更官方）
- 秘密动机应微妙影响发言倾向，但不可直接暴露
- 驳斥时要有理有据，不可人身攻击
- 补充时要有新信息或新视角
- 支持时可以追加论据或举例
- 语言风格必须符合当前历史文化时代，绝不出戏
- Officialdom模式下：廷议改为"议事"，发言者是同僚，称呼玩家时用官职名而非"陛下"，自称用"下官""卑职"等（对高品级）或"本官"（对低品级），辩论风格更接近同僚争论而非朝堂奏对${JSON_OUTPUT_INSTRUCTION}`;

const COURT_DEBATE_SCHEMA_PROMPT = `

【输出 JSON 结构】你必须严格按以下结构返回JSON：
{
  "speaker_role": "General或Diplomat或Intel或Scholar或Merchant",
  "speaker_name": "发言顾问姓名（必须与内阁成员名单一致）",
  "stance": "support或oppose或supplement",
  "content": "廷议发言（简体中文，80-150字，语言风格须符合历史文化时代）"
}
注意：
- speaker_name必须与内阁成员名单中的名字完全一致
- stance必须三选一
- content的语言风格必须符合当前剧本的历史文化时代`;

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
): Promise<CourtDebateResponse> {
  const provider = getProvider();

  const advisorsInfo = advisors
    .map(
      (a) =>
        `- ${ROLE_LABELS[a.role]}（${a.role}）：${a.name}，倾向：${a.bias}，秘密动机：${a.hidden_motive || "无"}`,
    )
    .join("\n");

  const recentHistory =
    historyLog.length > 0
      ? historyLog
          .slice(-2)
          .map((h, i) => `回合${historyLog.length - 1 + i}: ${h}`)
          .join("\n")
      : "（无）";

  const debateHistoryText =
    debateHistory.length > 0
      ? debateHistory
          .map((msg) => {
            if (msg.role === "user") {
              return `【${scenario.player_context.leader_title}】${msg.content}`;
            }
            const stanceLabel =
              msg.stance === "support"
                ? "支持"
                : msg.stance === "oppose"
                  ? "驳斥"
                  : "补充";
            return `【${ROLE_LABELS[msg.advisorRole!] ?? msg.advisorRole} ${msg.advisorName}（${stanceLabel}）】${msg.content}`;
          })
          .join("\n")
      : "（尚无发言）";

  const lastSpeaker =
    debateHistory.length > 0 &&
    debateHistory[debateHistory.length - 1].role === "advisor"
      ? `${debateHistory[debateHistory.length - 1].advisorName}（${ROLE_LABELS[debateHistory[debateHistory.length - 1].advisorRole!] ?? debateHistory[debateHistory.length - 1].advisorRole}）`
      : "无（首轮发言）";

  const systemPrompt = COURT_DEBATE_SYSTEM_PROMPT.replace(
    "{advisors_info}",
    advisorsInfo,
  )
    .replace("{nation_name}", scenario.player_context.nation_name)
    .replace(/{leader_title}/g, scenario.player_context.leader_title)
    .replace("{current_date}", currentDateDisplay || scenario.start_date)
    .replace("{stability}", String(stats.stability))
    .replace("{economy}", String(stats.economy))
    .replace("{military}", String(stats.military))
    .replace("{international_standing}", String(stats.international_standing))
    .replace("{situation_update}", currentSituation || "暂无特别局势变化")
    .replace("{recent_history}", recentHistory)
    .replace("{topic}", topic)
    .replace("{debate_history}", debateHistoryText)
    .replace("{last_speaker}", lastSpeaker)
    .replace("{remaining_rounds}", String(remainingRounds));

  const fullSystemPrompt = provider.supportsStructuredOutput()
    ? systemPrompt
    : systemPrompt + COURT_DEBATE_SCHEMA_PROMPT;

  const userContent =
    debateHistory.length === 0
      ? `{leader_title}提出议题："${topic}"\n\n请选择最合适的内阁成员率先回应。`
      : `请根据辩论历史，选择下一位最合适的内阁成员回应（不可与上一位发言者相同）。`;

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
        throw new Error("廷议发言为空");
      }

      if (!result.speaker_role || !result.speaker_name || !result.stance) {
        throw new Error("廷议响应缺少必要字段");
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
