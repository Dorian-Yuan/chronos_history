import type {
  ScenarioData,
  TurnResult,
  EndGameAnalysis,
  GameStats,
  PlayStyle,
} from "@/types";
import type { AIMessage } from "@/types/ai-provider";
import { createProvider, withRetry } from "@/lib/ai";
import { useSettingsStore } from "@/stores";
import { scenarioSchema, turnResultSchema, analysisSchema } from "./schemas";
import { checkObjectForSensitiveContent } from "./sensitive-content";

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

const SCENARIO_SYSTEM_PROMPT = `你是Chronos历史推演引擎的剧本生成器。根据玩家选择的执政基调，生成一个历史决策推演剧本。

严格规则：
1. 身份定义：必须明确玩家角色（皇帝/首相/革命领袖/商人王子等），给出具体的nation_name和leader_title
2. 多样性：不限于古代，包括工业革命、冷战、文艺复兴、中世纪、近代等任何历史时期
3. 匿名化：所有人名、地名、派系名必须完全虚构，但保持历史氛围
4. 命名一致性：同一剧本内所有名字必须遵循单一文化风格
5. 时代一致性：技术、武器、概念必须符合历史时代
6. 内容限制：禁止1949年后中国大陆政治事件、领土主权争议等敏感内容
7. 剧本标题必须是4个中文字
8. 初始属性总和应在200-320之间，确保游戏可玩性
9. 必须生成2-4个初始派系
10. 必须生成5个初始顾问（General/Diplomat/Intel/Scholar/Merchant各一个）
11. hidden_real_event填写该剧本所基于的真实历史事件名称，玩家不可见
12. start_date使用中文日期格式，如"1898年 戊戌春"

执政基调说明：
- Conquest（铁血征服）：军事冲突与版图扩张为主，初始military较高
- Prosperity（商贸繁荣）：经济建设与贸易垄断为主，初始economy较高
- Reform（文明变革）：政治改革、文化与外交为主，初始stability较高
- Survival（绝境求生）：崩溃边缘剧本，初始属性普遍较低（30-45），面临多重危机${JSON_OUTPUT_INSTRUCTION}`;

export async function generateScenario(
  playStyle: PlayStyle,
  playedEvents: string[] = [],
): Promise<ScenarioData> {
  const provider = getProvider();

  const userContent =
    playedEvents.length > 0
      ? `执政基调：${playStyle}\n\n已玩过的历史事件（请避免重复）：\n${playedEvents.map((e, i) => `${i + 1}. ${e}`).join("\n")}`
      : `执政基调：${playStyle}`;

  const messages: AIMessage[] = [
    { role: "system", content: SCENARIO_SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: scenarioSchema,
        temperature: 1.0,
        maxTokens: 4096,
      });

      const scenario = parseResponse<ScenarioData>(response.content, provider);

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
- military < 30：不能发动进攻战争
- military < 50：不能多线作战
- economy < 30：不能资助大型项目
- economy < 50：不能维持长期战争
- stability < 30：任何重大行动有叛乱/政变风险
- international_standing < 30：外交倡议将被无视

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
- 8回合后仅在极端情况下结束（属性归零/国家灭亡/领袖被推翻）

【叙事要求】
- narrative：用户行动的直接后果，200-500字，生动有画面感
- situation_update：新挑战/危机，可以是军事威胁、经济崩溃、宗教分裂、技术颠覆、外交丑闻等
- headline：报纸/诏令标题，简洁有力
- rumor：民间流言，有趣且暗示潜在危机
- date_display：当前相对日期

【顾问要求】
- 必须返回5个顾问（General/Diplomat/Intel/Scholar/Merchant各一个）
- 每个顾问从自己的偏见角度给出建议
- 部分建议看似合理但可能导致坏结果（陷阱建议）
- hidden_motive：顾问的秘密动机

【派系更新要求】
- 必须返回factions_update数组
- 被消灭的派系标记is_destroyed: true，attitude设为"已灭亡"
- 新威胁出现时添加新派系，标记is_new: true
- 根据玩家行动更新态度
- 活跃派系总数保持在2-4个${JSON_OUTPUT_INSTRUCTION}`;

export async function evaluateTurn(
  scenario: ScenarioData,
  historyLog: string[],
  userAction: string,
  currentStats: GameStats,
  turnCount: number,
): Promise<TurnResult> {
  const provider = getProvider();

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
    { role: "system", content: TURN_SYSTEM_PROMPT },
    { role: "user", content: contextMessage },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        responseSchema: turnResultSchema,
        temperature: 0.9,
        maxTokens: 4096,
      });

      const result = parseResponse<TurnResult>(response.content, provider);

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
6. persona_title：给玩家的统治者画像标题（如"开明的独裁者"、"商业巨擘"、"铁腕暴君"）
7. persona_description：画像描述
8. radar_stats：5维雷达图数据（Authority/Strategy/Empathy/Vision/Economy），每项0-100
9. turn_reviews：每回合的决策复盘，包含summary和commentary（战略点评）${JSON_OUTPUT_INSTRUCTION}`;

export async function analyzeGame(
  scenario: ScenarioData,
  historyLog: string[],
): Promise<EndGameAnalysis> {
  const provider = getProvider();

  const contextMessage = `剧本：${scenario.title}
真实历史事件：${scenario.hidden_real_event}
玩家国家：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}

历史日志：
${historyLog.map((h, i) => `回合${i + 1}: ${h}`).join("\n")}`;

  const messages: AIMessage[] = [
    { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
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
