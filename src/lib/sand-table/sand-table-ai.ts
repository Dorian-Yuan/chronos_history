import type {
  ScenarioData,
  GameStats,
  FactionData,
  SandTableMapResult,
  SandTableTurnUpdate,
} from "@/types";
import type { AIMessage } from "@/types/ai-provider";
import { createProvider, withRetry } from "@/lib/ai";
import { useSettingsStore } from "@/stores";
import { JSON_OUTPUT_INSTRUCTION } from "@/lib/game/ai-prompts/shared-prompts";

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

const SAND_TABLE_MAP_SYSTEM_PROMPT = `你是Chronos历史推演引擎的沙盘地图生成器。根据剧本的时代背景和势力分布，生成一个战略沙盘地图的初始布局。

【语言规则——最高优先级】
所有文本字段必须使用简体中文，禁止英文（JSON字段名除外）。

【硬性约束清单】
1. 地图需符合真实地理逻辑：
   - 中国朝代：中心=中原，北=草原/游牧，南=百越/蛮荒，西=西域/沙漠，东=海洋/半岛
   - 日本战国：中心=京都/畿内，各方向=各藩国
   - 欧洲中世纪：中心=玩家国，各方向=邻国/山脉/海洋
   - 中东/南亚：中心=玩家国，各方向=沙漠/山脉中的势力
   - 其他文明：按其真实地理分布
2. 玩家势力位于地图中心偏核心区域（x:0.4-0.6, y:0.4-0.6）
3. 外部势力按其真实方位分布在地图边缘
4. 只包含外部势力（is_external=true）和玩家势力，不包含内部势力
5. 每个势力至少1个控制节点，主节点在其方位的核心区域
6. 力量值(power)根据态度推算：敌对=1.5-2.5，求和=1.0-1.5，中立=1.0，友好=0.8-1.2，臣服=0.5-0.8
7. 玩家势力power根据初始属性推算：属性均值50=1.5，每高10+0.3
8. 区域名称需符合时代地理，5-8个区域
9. 摩擦力(friction)规则：山地1.5-2.5，沙漠1.8-3.0，森林1.2-1.8，平原0.8-1.2，水域2.5-4.0，冻原1.5-2.0
10. rgb颜色：玩家势力用[46,206,139]绿色，其他势力用不同色系且互相区分

【输出格式】
{
  "factions": [
    {
      "id": "A",
      "name": "势力名",
      "nodes": [{"x": 0.5, "y": 0.3}],
      "power": 1.5,
      "targetPower": 1.5,
      "rgb": [214, 69, 65],
      "isPlayer": false,
      "dead": false,
      "direction": "北方"
    }
  ],
  "regions": [
    {
      "name": "中原",
      "x": 0.5,
      "y": 0.5,
      "terrainType": "plains",
      "friction": 1.0
    }
  ]
}

【生成后自检】
1. 玩家势力是否在中心区域？
2. 外部势力方位是否合理？
3. 是否只包含外部势力+玩家势力？
4. 颜色是否互相区分？
5. 区域地理是否符合时代？
不通过则修正后再输出${JSON_OUTPUT_INSTRUCTION}`;

const SAND_TABLE_UPDATE_SYSTEM_PROMPT = `你是Chronos历史推演引擎的沙盘演算器。你的任务是对本回合已发生的事件进行量化评估，将叙事性的事件转化为各势力力量值的精确变化。

【核心原则】
你返回的结果是对本回合已发生事件的量化表述，不是进一步推演。你只需将回合结果中隐含的势力消长转化为数值。

【量化规则】
1. 力量变化(power_delta)需与本回合属性变化和事件逻辑严格一致
2. 玩家军事上升→玩家势力扩张(power_delta正)，敌对势力收缩(power_delta负)
3. 玩家军事下降→敌对势力扩张(power_delta正)，玩家势力收缩(power_delta负)
4. 敌对势力被击败→该势力power_delta为较大负值
5. 新势力出现→power约1.0-1.5
6. 已灭亡势力不输出
7. power_delta范围：-1.5到+2.0
8. 只输出外部势力，不输出内部势力

【输出格式——严格JSON，无事件描述】
{
  "factions": [
    {
      "name": "势力名",
      "power_delta": 0.5
    }
  ]
}

注意：不要包含event、description等事件描述字段，只需name和power_delta。${JSON_OUTPUT_INSTRUCTION}`;

export async function generateSandTableMap(
  scenario: ScenarioData,
  stats: GameStats,
): Promise<SandTableMapResult> {
  const provider = getProvider();

  const externalFactions = scenario.factions.filter(
    (f) => f.is_external !== false,
  );
  const avgStat =
    (stats.stability +
      stats.economy +
      stats.military +
      stats.international_standing) /
    4;
  const playerPower = 1.5 + (avgStat - 50) * 0.03;

  const factionsInfo = externalFactions
    .map(
      (f) =>
        `- ${f.name}（领袖：${f.leader || "未知"}，态度：${f.attitude}，${f.is_external ? "外部" : "内部"}势力）：${f.description}`,
    )
    .join("\n");

  const userPrompt = `当前剧本：${scenario.title}
玩家国家：${scenario.player_context.nation_name}
玩家身份：${scenario.player_context.leader_title}
执政基调：${scenario.play_style}
初始纪年：${scenario.start_date}
玩家初始属性均值：${avgStat.toFixed(1)}（推算玩家power≈${playerPower.toFixed(2)}）

外部势力列表：
${factionsInfo}

请生成沙盘地图初始布局。`;

  const systemPrompt = provider.supportsStructuredOutput()
    ? SAND_TABLE_MAP_SYSTEM_PROMPT
    : SAND_TABLE_MAP_SYSTEM_PROMPT;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        temperature: 0.7,
        maxTokens: 2048,
      });

      const result = parseResponse<SandTableMapResult>(
        response.content,
        provider,
      );

      if (!result.factions || !Array.isArray(result.factions)) {
        throw new Error("沙盘地图生成失败：缺少factions数组");
      }
      if (!result.regions || !Array.isArray(result.regions)) {
        throw new Error("沙盘地图生成失败：缺少regions数组");
      }

      const hasPlayer = result.factions.some((f) => f.isPlayer);
      if (!hasPlayer) {
        result.factions.unshift({
          id: "PLAYER",
          name: scenario.player_context.nation_name,
          nodes: [{ x: 0.5, y: 0.5 }],
          power: playerPower,
          targetPower: playerPower,
          rgb: [46, 206, 139],
          isPlayer: true,
          dead: false,
          direction: "中心",
        });
      }

      return result;
    },
    { maxRetries: 2 },
  );
}

export async function updateSandTable(
  scenario: ScenarioData,
  currentFactions: FactionData[],
  sandTableFactions: {
    name: string;
    power: number;
    dead: boolean;
    isPlayer: boolean;
  }[],
  statsDelta: {
    stability: number;
    economy: number;
    military: number;
    international_standing: number;
  },
  currentStats: GameStats,
  playerAction: string,
  turnCount: number,
): Promise<SandTableTurnUpdate> {
  const provider = getProvider();

  const aliveFactions = sandTableFactions.filter((f) => !f.dead && !f.isPlayer);

  if (aliveFactions.length === 0) {
    return { factions: [] };
  }

  const factionsState = aliveFactions
    .map((f) => `"${f.name}": {当前力量: ${f.power.toFixed(2)}}`)
    .join(", ");

  const statLabels = {
    stability: "稳定性",
    economy: "经济",
    military: "军事",
    international_standing: "国际声望",
  };

  const userPrompt = `当前剧本：${scenario.title}
玩家国家：${scenario.player_context.nation_name}
当前回合：第${turnCount}回合

本回合属性变化：
- ${statLabels.stability}：${statsDelta.stability > 0 ? "+" : ""}${statsDelta.stability}
- ${statLabels.economy}：${statsDelta.economy > 0 ? "+" : ""}${statsDelta.economy}
- ${statLabels.military}：${statsDelta.military > 0 ? "+" : ""}${statsDelta.military}
- ${statLabels.international_standing}：${statsDelta.international_standing > 0 ? "+" : ""}${statsDelta.international_standing}

当前属性值：
- ${statLabels.stability}：${currentStats.stability}
- ${statLabels.economy}：${currentStats.economy}
- ${statLabels.military}：${currentStats.military}
- ${statLabels.international_standing}：${currentStats.international_standing}

玩家行动：${playerAction}

当前存活外部势力状态：{${factionsState}}

请对本回合事件进行量化评估，返回各外部势力的力量变化。`;

  const systemPrompt = provider.supportsStructuredOutput()
    ? SAND_TABLE_UPDATE_SYSTEM_PROMPT
    : SAND_TABLE_UPDATE_SYSTEM_PROMPT;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  return withRetry(
    async () => {
      const response = await provider.sendMessage(messages, {
        responseFormat: "json",
        temperature: 0.6,
        maxTokens: 1024,
      });

      const result = parseResponse<SandTableTurnUpdate>(
        response.content,
        provider,
      );

      if (!result.factions || !Array.isArray(result.factions)) {
        throw new Error("沙盘更新失败：缺少factions数组");
      }

      return result;
    },
    { maxRetries: 2 },
  );
}
