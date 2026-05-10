import type {
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  GameStats,
  PlayStyle,
  AdvisorRole,
} from "@/types";
import type { AIMessage } from "@/types/ai-provider";
import { createProvider, withRetry } from "@/lib/ai";
import { useSettingsStore } from "@/stores";
import { scenarioSchema, turnResultSchema, analysisSchema } from "./schemas";
import { checkObjectForSensitiveContent } from "./sensitive-content";

const REQUIRED_ADVISOR_ROLES: AdvisorRole[] = [
  "General",
  "Diplomat",
  "Intel",
  "Scholar",
  "Merchant",
];

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

const JSON_OUTPUT_INSTRUCTION = `\n\n【输出格式】你必须只返回纯 JSON 对象，不要包含任何其他文字、解释、注释或 markdown 标记（如 \`\`\`json）。直接以 { 开头，以 } 结尾。`;

const SCENARIO_SCHEMA_PROMPT = `

【输出 JSON 结构】你必须严格按以下结构返回JSON：
{
  "id": "唯一标识字符串",
  "title": "4字中文标题",
  "description": "匿名化的情境描述（200-400字）",
  "player_context": {
    "nation_name": "玩家国家/派系名称",
    "leader_title": "玩家头衔（如皇帝、国王、执政官、总督、大公、首相、摄政王、城邦领主等）",
    "background_summary": "背景简介（100-200字）"
  },
  "initial_stats": {
    "stability": 数字(0-100),
    "economy": 数字(0-100),
    "military": 数字(0-100),
    "international_standing": 数字(0-100)
  },
  "hidden_real_event": "真实历史事件名称",
  "play_style": "Conquest或Prosperity或Reform或Survival",
  "start_date": "中文日期字符串（风格与时代一致，如中国朝代用年号格式）",
  "initial_advisors": [
    {
      "role": "General",
      "name": "真实人名（禁止奇幻风格，中国用姓+名如'陈伯年'，欧洲用名+姓，禁止'铁牙''影爪'等，必须全为中文）",
      "advice": "建议（简体中文）",
      "bias": "倾向描述"
    },
    { "role": "Diplomat", ... },
    { "role": "Intel", ... },
    { "role": "Scholar", ... },
    { "role": "Merchant", ... }
  ],
  "factions": [
    {
      "name": "2字势力简称（必须真实可信，禁止奇幻风格如'暗影''血月'）",
      "description": "势力描述（Conquest以外国势力为主，Prosperity以经济集团为主，Reform以内部政治力量为主，Survival内外兼有）",
      "strength": "主要优势",
      "weakness": "关键弱点",
      "needs": "急需什么",
      "attitude": "当前立场"
    }
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
      "bias": "倾向",
      "hidden_motive": "秘密动机"
    }
  ],
  "factions_update": [
    {
      "name": "派系名",
      "description": "描述",
      "strength": "优势",
      "weakness": "弱点",
      "needs": "需求",
      "attitude": "立场",
      "is_new": 布尔值,
      "is_destroyed": 布尔值
    }
  ],
  "hidden_consequences": "回合总结（AI长期记忆）",
  "is_game_over": 布尔值,
  "game_over_reason": "结束原因（如未结束则为空字符串）"
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
  ]
}`;

const SCENARIO_SYSTEM_PROMPT = `你是Chronos历史推演引擎的剧本生成器。根据玩家选择的执政基调，生成一个历史决策推演剧本。

严格规则：
1. 身份定义：必须明确玩家角色，给出具体的nation_name和leader_title。角色应与时代匹配，如：皇帝、天子、国王、亲王、大公、执政官、总督、首相、摄政王、城邦领主、领主、革命委员会主席、商会会长等
   【硬性禁止】leader_title绝对不能是"可汗""大汗""汗"或任何游牧民族领袖头衔
2. 多样性（最重要）：每次生成必须从不同的历史时期和文化圈中随机选取背景。你应该尽可能随机地选择时期，不要偏好任何特定文化圈，避免选择最常见的时期，追求多样性和意外感。可选文化圈包括但不限于：
   - 古希腊/罗马：城邦政治、元老院、共和国危机
   - 中世纪欧洲：封建领主、十字军、教权与王权
   - 文艺复兴意大利：城邦外交、美第奇式家族、雇佣兵
   - 大航海时代：殖民帝国、远洋贸易、新大陆
   - 工业革命：工厂主与工人、殖民扩张、技术变革
   - 中东/奥斯曼：苏丹、帕夏、宗教与世俗
   - 东南亚：海上贸易王国、海岛纷争
   - 非洲：王国兴衰
   - 日本：幕府将军、战国大名
   - 中国封建王朝（Conquest倾向）：战国七雄、春秋争霸、楚汉争霸、隋末群雄、安史之乱、太平天国、秦末群雄、三国鼎立、五胡乱华、靖难之役、五代十国、明末乱世
   - 中国封建王朝（Prosperity倾向）：汉通西域、丝绸之路、盛唐万邦来朝、宋元海上贸易、郑和下西洋、文景之治、贞观之治、开元盛世、仁宗之治、宋朝重商
   - 中国封建王朝（Reform倾向）：商鞅变法、王安石变法、北魏孝文帝改革、张居正改革、庆历新政、王莽改制、以及其他必须改革的时期
   - 中国封建王朝（Survival倾向）：西周末年、东汉末年、南明偏安、南宋抗金、南明抗清、东周王权衰落、南宋偏安、刘禅时期蜀国、秦二世、以及其他生死存亡的关头
   注意：以上中国时期仅为示例，AI应从中涌现选择，务必不要局限于列出的时期
   【硬性禁止】绝对禁止生成以下背景：蒙古汗国、草原汗国、游牧帝国、任何以"可汗"为领袖的政权。Conquest模式下应以50%的概率选择中国封建王朝（清朝之前）的战争时期，如战国、三国、楚汉、安史之乱等，50%的概率选择其他文明
3. 命名规范（极其重要）：
   a) 所有人名、地名、派系名必须完全虚构，但保持历史氛围
   b) 人名必须像该文明该时代的真实人名，绝不能像奇幻小说或游戏角色
   c) 【禁止的人名风格】以下风格绝对禁止：
      - 动物+动作组合：如"铁牙""白羽""影爪""血鹰""苍狼"
      - 抽象意象+动作：如"墨痕""风行""雷鸣""冰刃"
      - 带分隔符的"部落名"：如"铁牙·元术""白羽·萨满"
      - 任何带有"·"分隔符的双段式名字
   d) 【正确的人名风格】应参考对应文明的真实命名传统，所有人名必须用中文：
      - 中国：姓+名，如"陈伯年""赵元朗""李承恩""周德清""张守正"
      - 日本：姓+名，如"�的场信长""�的场义元""�的场康政"（虚构但符合日本姓氏规律）
      - 欧洲：名+姓的中文译名，如"腓特烈·冯·黑森""亚历山德罗·美第奇""休·德·莫蒂默"
      - 中东：名+父名的中文译名，如"艾哈迈德·伊本·哈桑""塞利姆·帕夏·拉希德"
      - 东南亚/非洲/拉美：对应文明的真实命名传统的中文译名
   e) 派系名也必须真实可信，禁止奇幻风格。示例：
      - 正确："陇西世家""关东联军""江南商帮""北庭都护""十字军""教廷""地中海商会""织田幕府"
      - 禁止："暗影部落""血月军团""苍狼部""铁骑盟"
4. 命名一致性：同一剧本内所有名字必须遵循单一文化风格
5. 时代一致性：技术、武器、概念必须符合历史时代
6. 内容限制：禁止1949年后中国大陆政治事件、领土主权争议等敏感内容
7. 剧本标题必须是4个中文字
8. 初始属性总和应在200-320之间，确保游戏可玩性
9. 必须生成3-4个初始派系
10. 必须生成5个初始顾问（General/Diplomat/Intel/Scholar/Merchant各一个）
11. hidden_real_event填写该剧本所基于的真实历史事件名称，玩家不可见
12. start_date使用中文日期格式，应与所选文化圈的时代风格一致。示例：
    - 古典时期："公元前44年 共和末年"
    - 中世纪欧洲："1215年 仲夏"
    - 文艺复兴："1494年 佛罗伦萨之春"
    - 大航海："1588年 无敌舰队之年"
    - 工业革命："1848年 革命之春"
    - 中国朝代："建安十三年 秋"、"天宝十四载 冬"、"靖康元年 正月"、"万历二十年 春"
    - 日本："庆长五年 关原前夕"、"元禄三年 春"
    - 冷战："1962年 秋"

执政基调说明：
- Conquest（铁血征服）：军事冲突与版图扩张为主，初始military较高
- Prosperity（商贸繁荣）：经济建设与贸易垄断为主，初始economy较高
- Reform（文明变革）：政治改革、文化与外交为主，初始stability较高
- Survival（绝境求生）：崩溃边缘剧本，初始属性普遍较低（30-45），面临多重危机

【派系生成规则——按执政基调严格区分】
派系(factions)的类型和构成必须与执政基调紧密匹配：

- Conquest（铁血征服）：派系必须以外部敌对势力/外国为主（至少3个），内部派系至多1-2个。
  外部势力示例：边境蛮族王国、海上入侵者、敌对帝国、殖民竞争国、宗教狂热邻国
  内部派系示例：主和派贵族（反对战争）、军需供应商（发战争财）
  禁止：征服剧本不应以"宫廷阴谋""后宫干政"等纯内部政治派系为主

- Prosperity（商贸繁荣）：派系以经济利益集团和贸易伙伴/竞争对手为主。
  外部势力示例：垄断贸易联盟、海外殖民公司、竞争商业城邦
  内部派系示例：行会联盟、新兴资本家、传统贵族地主
  禁止：商贸剧本不应以纯军事入侵者为主要派系

- Reform（文明变革）：派系以改革vs保守的内部政治力量为主，辅以外部压力。
  内部派系示例：改革派、保守派、宗教势力、军方势力（至少3个内部）
  外部势力示例：施压的外国势力、意识形态对手（至多1-2个）
  禁止：改革剧本不应以外部军事入侵为主要派系

- Survival（绝境求生）：派系应同时包含内部崩溃因素和外部威胁，危机四伏。
  内部派系示例：叛军/分裂势力、饥荒流民、政变阴谋者
  外部势力示例：入侵军队、封锁国境的敌对联盟、趁火打劫的邻国
  要求：至少2个内部+至少1个外部，体现内外交困${JSON_OUTPUT_INSTRUCTION}`;

export async function generateScenario(
  playStyle: PlayStyle,
): Promise<ScenarioData> {
  const provider = getProvider();

  const structuredOutputSupported = provider.supportsStructuredOutput();
  console.log(
    "[generateScenario] provider:",
    provider.id,
    "supportsStructuredOutput:",
    structuredOutputSupported,
  );

  const systemPrompt = structuredOutputSupported
    ? SCENARIO_SYSTEM_PROMPT
    : SCENARIO_SYSTEM_PROMPT + SCENARIO_SCHEMA_PROMPT;

  console.log(
    "[generateScenario] systemPrompt length:",
    systemPrompt.length,
    "includes schema:",
    !structuredOutputSupported,
  );

  const userContent = playStyle === "Conquest"
    ? `执政基调：${playStyle}\n\n以50%的概率从中国封建王朝（清朝之前）的战争时期和其他所有文明中选取背景，如战国、三国、楚汉争霸、安史之乱、隋末群雄等。绝对禁止选择草原汗国/游牧帝国背景。`
    : `执政基调：${playStyle}\n\n请从所有可选文化圈和历史时期中尽可能随机地选取一个，避免选择最常见的时期，追求多样性和意外感。绝对禁止选择草原汗国/游牧帝国背景。`;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userContent },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: scenarioSchema,
        temperature: 1.0,
        maxTokens: 100000,
      });

      const scenario = parseResponse<ScenarioData>(response.content, provider);

      console.log(
        "[generateScenario] parsed scenario keys:",
        Object.keys(scenario),
      );
      console.log(
        "[generateScenario] player_context:",
        scenario.player_context,
      );
      console.log("[generateScenario] initial_stats:", scenario.initial_stats);
      console.log(
        "[generateScenario] initial_advisors count:",
        scenario.initial_advisors?.length,
      );
      console.log(
        "[generateScenario] factions count:",
        scenario.factions?.length,
      );

      validateScenario(scenario);

      if (checkObjectForSensitiveContent(scenario)) {
        throw new Error(
          "Generated content contains sensitive keywords, retrying...",
        );
      }

      return scenario;
    },
    { maxRetries: 3 },
  );
}

const TURN_SYSTEM_PROMPT = `你是Chronos历史推演引擎的回合评估器。根据玩家的行动，评估后果并推进历史进程。

严格规则：

【可行性检查】
- military < 20：军队几近崩溃，任何军事行动都可能导致哗变，只能防守
- military < 30：不能发动进攻战争，只能进行防御性军事行动
- military < 50：不能多线作战，同一回合只能在一个方向发起军事行动
- military < 70：不能同时发动三线以上的大规模战争
- economy < 20：国库枯竭，任何需要资金的项目都无法启动，顾问薪饷可能拖欠
- economy < 30：不能资助大型项目（如修筑城墙、远征、大型基建）
- economy < 50：不能维持长期战争（超过3回合的战争将导致经济崩溃）
- economy < 70：不能同时资助多个大型项目
- stability < 20：国家濒临崩溃，任何行动都可能触发政变或分裂
- stability < 30：任何重大行动有叛乱/政变风险，改革类行动失败率极高
- stability < 50：不能进行激进改革，否则引发大规模抗议
- international_standing < 20：被国际社会孤立，外交渠道关闭，任何外交倡议都会被嘲讽
- international_standing < 30：外交倡议将被无视，盟友可能背叛
- international_standing < 50：不能发起多边外交倡议，只能进行双边谈判

【难度缩放】
- Survival：最严酷，属性变化偏向负值（-8到+5），频繁灾难
- Conquest：军事行动高方差，大胜或惨败
- Reform：改革需多回合才见效
- Prosperity：经济收益缓慢稳定

【属性变化规则】
- 每项属性每回合变化 -10 到 +10
- 前4回合（早期）：-5 到 +8，更温和
- 前8回合不会有属性降到0
- 变化必须由叙事逻辑支撑，不能随意跳变

【游戏时长】
- 最少8回合才能结束（is_game_over在8回合前必须为false）
- 最多28回合硬上限
- 8回合后可结束游戏的情况：
  a) 极端情况：属性归零、国家灭亡、领袖被推翻
  b) 完成统一：所有敌对势力已被征服或臣服，版图统一
  c) 问题解决：主要危机已化解，国家进入稳定繁荣期，连续2回合无重大威胁
  d) 玩家明确要求：玩家行动中明确表达了"结束本次游戏""功成身退"等意图

【叙事要求】
- narrative：用户行动的直接后果，200-500字，生动有画面感
- situation_update：新挑战/危机，可以是军事威胁、经济崩溃、宗教分裂、技术颠覆、外交丑闻等
- headline：报纸/诏令标题，简洁有力
- rumor：民间流言，有趣且暗示潜在危机
- date_display：当前相对日期

【顾问要求】
- 必须返回5个顾问（General/Diplomat/Intel/Scholar/Merchant各一个）
- 顾问稳定性：从第一次生成开始，顾问非必要不更换，保持name和role一致。仅在以下情况可更换：顾问因剧情死亡/被罢免/叛逃/升迁调任，此时新顾问标记为替补
- 每个顾问从自己的偏见角度给出建议
- 部分建议看似合理但可能导致坏结果（陷阱建议）
- hidden_motive：顾问的秘密动机（要保持连贯，不要前后矛盾）

【派系更新要求】
- 必须返回factions_update数组
- 被消灭的派系标记is_destroyed: true，attitude设为"已灭亡"
- 已灭亡的派系在后续回合中不再更新，不再出现在factions_update中
- 新威胁出现时添加新派系，标记is_new: true
- 根据玩家行动更新态度
- 活跃派系总数严格控制在6个以内（含新增），绝对不能超过6个${JSON_OUTPUT_INSTRUCTION}`;

export async function evaluateTurn(
  scenario: ScenarioData,
  historyLog: string[],
  userAction: string,
  currentStats: GameStats,
  turnCount: number,
): Promise<TurnResult> {
  const provider = getProvider();

  const systemPrompt = provider.supportsStructuredOutput()
    ? TURN_SYSTEM_PROMPT
    : TURN_SYSTEM_PROMPT + TURN_SCHEMA_PROMPT;

  const contextMessage = `当前剧本：${scenario.title}
玩家国家：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}
执政基调：${scenario.play_style}
当前回合：第${turnCount}回合

当前属性：
- 稳定性(stability)：${currentStats.stability}
- 经济(economy)：${currentStats.economy}
- 军事(military)：${currentStats.military}
- 国际声望(international_standing)：${currentStats.international_standing}

历史日志（AI长期记忆）：
${historyLog.length > 0 ? historyLog.map((h, i) => `回合${i + 1}: ${h}`).join("\n") : "（无）"}

当前派系：
${scenario.factions.map((f) => `- ${f.name}（${f.attitude}）：${f.description}`).join("\n")}

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
        temperature: 0.9,
        maxTokens: 100000,
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

要求：
1. real_event_title：揭示剧本所基于的真实历史事件名称
2. real_outcome_summary：真实历史的结果
3. user_outcome_summary：玩家时间线的结果
4. comparison_text：对比分析，指出玩家决策与历史走向的异同
5. similar_historical_figure：与玩家决策风格最相似的历史人物
6. persona_title：根据玩家全程经历，匹配最接近的统治者画像标题。包括但不限于："开明的独裁者"、"商业巨擘"、"铁腕暴君"、"仁慈的守成者"、"狡猾的纵横家"、"穷兵黩武的征服者"、"力挽狂澜的改革者"、"优柔寡断的庸君"、"深谋远虑的战略家"、"与民休息的治世之主"
7. persona_description：画像描述，结合玩家具体决策给出个性化评价
8. radar_stats：5维雷达图数据（Authority/Strategy/Empathy/Vision/Economy），每项0-100
9. turn_reviews：每回合的决策复盘，包含summary和commentary。commentary必须兼顾正反两面——先肯定玩家在该回合做得好的决策，再指出不足之处或可以改进的地方。不要只批评也不只赞美，要像一位既欣赏学生才华又严格要求的导师${JSON_OUTPUT_INSTRUCTION}`;

export async function analyzeGame(
  scenario: ScenarioData,
  historyLog: string[],
): Promise<EndGameAnalysis> {
  const provider = getProvider();

  const systemPrompt = provider.supportsStructuredOutput()
    ? ANALYSIS_SYSTEM_PROMPT
    : ANALYSIS_SYSTEM_PROMPT + ANALYSIS_SCHEMA_PROMPT;

  const contextMessage = `剧本：${scenario.title}
真实历史事件：${scenario.hidden_real_event}
玩家国家：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}

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
        maxTokens: 100000,
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
