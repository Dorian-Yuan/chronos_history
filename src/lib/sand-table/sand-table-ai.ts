import type {
  ScenarioData,
  GameStats,
  FactionData,
  SandTableMapResult,
  SandTableTurnUpdate,
  SandTableFaction,
  SandTableState,
  SandTableRegion,
} from "@/types";
import type { AIMessage } from "@/types/ai-provider";
import { createProvider } from "@/lib/ai";
import { useSettingsStore } from "@/stores";
import { JSON_OUTPUT_INSTRUCTION } from "@/lib/game/ai-prompts/shared-prompts";
import { assignFactionColors } from "@/lib/sand-table/engine";

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

const DIRECTION_COORD_MAP: Record<
  string,
  { xMin: number; xMax: number; yMin: number; yMax: number }
> = {
  北: { xMin: 0.3, xMax: 0.7, yMin: 0.05, yMax: 0.2 },
  东北: { xMin: 0.7, xMax: 0.9, yMin: 0.05, yMax: 0.25 },
  东: { xMin: 0.75, xMax: 0.95, yMin: 0.3, yMax: 0.7 },
  东南: { xMin: 0.7, xMax: 0.9, yMin: 0.75, yMax: 0.95 },
  南: { xMin: 0.3, xMax: 0.7, yMin: 0.8, yMax: 0.95 },
  西南: { xMin: 0.1, xMax: 0.3, yMin: 0.75, yMax: 0.95 },
  西: { xMin: 0.05, xMax: 0.25, yMin: 0.3, yMax: 0.7 },
  西北: { xMin: 0.1, xMax: 0.3, yMin: 0.05, yMax: 0.25 },
};

function validateAndFixCoordinates(
  factions: SandTableFaction[],
): SandTableFaction[] {
  return factions.map((f) => {
    if (f.isPlayer) return f;

    const dir = f.direction?.trim();
    if (!dir || !(dir in DIRECTION_COORD_MAP)) return f;

    const range = DIRECTION_COORD_MAP[dir];
    const fixedNodes = f.nodes.map((node) => {
      let { x, y } = node;
      let needsFix = false;

      if (x < range.xMin || x > range.xMax) {
        x = range.xMin + Math.random() * (range.xMax - range.xMin);
        needsFix = true;
      }
      if (y < range.yMin || y > range.yMax) {
        y = range.yMin + Math.random() * (range.yMax - range.yMin);
        needsFix = true;
      }

      if (needsFix) {
        x = Math.round(x * 100) / 100;
        y = Math.round(y * 100) / 100;
      }

      return { x, y };
    });

    return { ...f, nodes: fixedNodes };
  });
}

const DEFAULT_REGION_TEMPLATES: {
  direction: string;
  name: string;
  terrainType: SandTableRegion["terrainType"];
  friction: number;
}[] = [
  { direction: "北", name: "北方高原", terrainType: "mountain", friction: 1.8 },
  { direction: "东北", name: "东北密林", terrainType: "forest", friction: 1.5 },
  { direction: "东", name: "东方平原", terrainType: "plains", friction: 1.0 },
  { direction: "东南", name: "东南水乡", terrainType: "water", friction: 2.8 },
  { direction: "南", name: "南方蛮荒", terrainType: "desert", friction: 2.2 },
  {
    direction: "西南",
    name: "西南群山",
    terrainType: "mountain",
    friction: 2.0,
  },
  { direction: "西", name: "西方大漠", terrainType: "desert", friction: 2.5 },
  { direction: "西北", name: "西北冻原", terrainType: "tundra", friction: 1.7 },
];

const ATTITUDE_POWER_MAP: Record<string, number> = {
  hostile: 2.2,
  aggressive: 2.0,
  wary: 1.6,
  neutral: 1.3,
  cautious: 1.1,
  friendly: 0.9,
  submissive: 0.6,
  vassal: 0.5,
  allied: 1.0,
};

function estimatePowerFromDescription(faction: FactionData): number {
  const text =
    `${faction.strength} ${faction.weakness} ${faction.description}`.toLowerCase();

  const strongKeywords = [
    "强大",
    "强盛",
    "精锐",
    "雄厚",
    "无敌",
    "霸主",
    "强权",
    "铁骑",
    "百万",
    "骁勇",
    "善战",
  ];
  const weakKeywords = [
    "衰弱",
    "疲敝",
    "内乱",
    "分裂",
    "虚弱",
    "式微",
    "困顿",
    "贫弱",
    "凋敝",
  ];

  let bonus = 0;
  for (const kw of strongKeywords) {
    if (text.includes(kw)) bonus += 0.3;
  }
  for (const kw of weakKeywords) {
    if (text.includes(kw)) bonus -= 0.3;
  }

  const attitude = faction.attitude?.toLowerCase() || "neutral";
  let basePower = ATTITUDE_POWER_MAP[attitude] ?? 1.3;

  basePower += bonus;
  return Math.max(0.3, Math.min(4.0, basePower));
}

function generateNodeForDirection(direction: string): { x: number; y: number } {
  const range = DIRECTION_COORD_MAP[direction];
  if (!range) {
    return {
      x: 0.5 + (Math.random() - 0.5) * 0.3,
      y: 0.5 + (Math.random() - 0.5) * 0.3,
    };
  }
  const x =
    Math.round((range.xMin + Math.random() * (range.xMax - range.xMin)) * 100) /
    100;
  const y =
    Math.round((range.yMin + Math.random() * (range.yMax - range.yMin)) * 100) /
    100;
  return { x, y };
}

export function generateDeterministicSandTableMap(
  scenario: ScenarioData,
  stats: GameStats,
): SandTableState {
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

  const playerFaction: SandTableFaction = {
    id: "PLAYER",
    name: scenario.player_context.nation_name,
    nodes: [{ x: 0.5, y: 0.5 }],
    power: playerPower,
    targetPower: playerPower,
    rgb: [46, 206, 139],
    isPlayer: true,
    dead: false,
    direction: "中心",
  };

  const factionMap = new Map<string, number>();
  externalFactions.forEach((f) => {
    factionMap.set(f.name, factionMap.size);
  });

  const sandTableFactions: SandTableFaction[] = externalFactions.map(
    (f, idx) => {
      const direction = f.direction || "北";
      const mainNode = generateNodeForDirection(direction);

      const secondaryNodes: { x: number; y: number }[] = [];
      if (Math.random() > 0.4) {
        const range = DIRECTION_COORD_MAP[direction];
        if (range) {
          const sx =
            Math.round(
              (range.xMin + Math.random() * (range.xMax - range.xMin)) * 100,
            ) / 100;
          const sy =
            Math.round(
              (range.yMin + Math.random() * (range.yMax - range.yMin)) * 100,
            ) / 100;
          secondaryNodes.push({ x: sx, y: sy });
        }
      }

      const power = estimatePowerFromDescription(f);

      return {
        id: `FACTION_${idx}`,
        name: f.name,
        nodes: [mainNode, ...secondaryNodes],
        power,
        targetPower: power,
        rgb: [0, 0, 0] as [number, number, number],
        isPlayer: false,
        dead: false,
        direction,
      };
    },
  );

  const allFactions = assignFactionColors([
    playerFaction,
    ...sandTableFactions,
  ]);

  const usedDirections = new Set(
    externalFactions.map((f) => f.direction || "北"),
  );
  const regions: SandTableRegion[] = DEFAULT_REGION_TEMPLATES.filter((t) =>
    usedDirections.has(t.direction),
  ).map((t) => {
    const range = DIRECTION_COORD_MAP[t.direction];
    const cx = range ? (range.xMin + range.xMax) / 2 : 0.5;
    const cy = range ? (range.yMin + range.yMax) / 2 : 0.5;
    return {
      name: t.name,
      x: cx,
      y: cy,
      terrainType: t.terrainType,
      friction: t.friction,
    };
  });

  regions.push({
    name: "中原腹地",
    x: 0.5,
    y: 0.5,
    terrainType: "plains",
    friction: 1.0,
  });

  return {
    factions: allFactions,
    regions,
    mapWidth: 360,
    mapHeight: 480,
    lastUpdateTurn: 1,
  };
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
3. 外部势力必须严格按照其真实方位分布在地图对应区域，方位坐标约束如下：
   - 北方势力：x:0.3-0.7, y:0.05-0.2（顶部居中）
   - 东北势力：x:0.7-0.9, y:0.05-0.25（右上）
   - 东方势力：x:0.75-0.95, y:0.3-0.7（右侧居中）
   - 东南势力：x:0.7-0.9, y:0.75-0.95（右下）
   - 南方势力：x:0.3-0.7, y:0.8-0.95（底部居中）
   - 西南势力：x:0.1-0.3, y:0.75-0.95（左下）
   - 西方势力：x:0.05-0.25, y:0.3-0.7（左侧居中）
   - 西北势力：x:0.1-0.3, y:0.05-0.25（左上）
4. 坐标随机性要求：各势力坐标必须在其方位范围内随机分布，禁止取范围中点，禁止多个势力坐标对齐成行或列，相邻势力之间应有错落感
5. 只包含外部势力（is_external=true）和玩家势力，不包含内部势力
6. 每个势力至少1个控制节点，主节点在其方位的核心区域
7. 力量值(power)推断规则（按优先级排序）：
   a) 首先根据势力的整体强弱描述(strength)、弱点(weakness)和描述(description)综合推断力量基础值
   b) 结合当前情景（剧本背景、时代特征、势力间力量对比）调整
   c) 态度仅作附加判断条件：臣服势力力量值须低于玩家势力；敌对势力可能较强也可能较弱，取决于其strength描述
   d) 力量值参考范围：极弱0.3-0.6，较弱0.6-1.0，一般1.0-1.5，较强1.5-2.5，极强2.5-4.0
8. 玩家势力power根据初始属性推算：属性均值50=1.5，每高10+0.3
9. 区域名称需符合时代地理，5-8个区域
10. 摩擦力(friction)规则：山地1.5-2.5，沙漠1.8-3.0，森林1.2-1.8，平原0.8-1.2，水域2.5-4.0，冻原1.5-2.0
11. rgb颜色：玩家势力用[46,206,139]绿色，其他势力用不同色系且互相区分
12. 势力名称必须与输入的势力列表中的名称完全一致，禁止缩写、简称、增删字或任何形式的名称变更

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
2. 外部势力方位是否合理？每个势力的坐标是否在其direction声明的方位范围内？
3. 是否只包含外部势力+玩家势力？
4. 颜色是否互相区分？
5. 区域地理是否符合时代？
6. 各势力坐标是否随机分布、没有对齐成行成列？
7. 各势力名称是否与输入的势力列表完全一致（一个字都不能差）？
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
9. 返回的势力名称必须与"当前存活外部势力状态"中的名称完全一致，禁止缩写、简称或任何形式的名称变更

【吞并规则】
1. 当某势力在本回合被击败/消灭时，须返回conquered_by字段，标明被哪个势力吞并
2. conquered_by必须为当前存活的外部势力或玩家势力名称
3. 被吞并势力的power_delta应为较大负值（-1.0到-2.0）

【新势力规则】
1. 当本回合有新势力出现时，须额外返回以下字段：
   - is_new_faction: true
   - direction: 新势力方位（北/东北/东/东南/南/西南/西/西北）
   - nodes: 新势力核心节点坐标，须在现有所有势力范围之外
2. 新势力power_delta即为其初始力量值（约1.0-1.5）
3. 新势力坐标须严格按照方位约束落在对应坐标范围内：
   - 北方：x:0.3-0.7, y:0.05-0.2
   - 东北：x:0.7-0.9, y:0.05-0.25
   - 东方：x:0.75-0.95, y:0.3-0.7
   - 东南：x:0.7-0.9, y:0.75-0.95
   - 南方：x:0.3-0.7, y:0.8-0.95
   - 西南：x:0.1-0.3, y:0.75-0.95
   - 西方：x:0.05-0.25, y:0.3-0.7
   - 西北：x:0.1-0.3, y:0.05-0.25
4. 新势力名称必须与情报页中的势力名称完全一致

【输出格式——严格JSON，无事件描述】
{
  "factions": [
    {
      "name": "势力名",
      "power_delta": 0.5,
      "conquered_by": "征服者势力名（仅被消灭时填写，否则不填）",
      "is_new_faction": false,
      "direction": "方位（仅新势力填写）",
      "nodes": [{"x": 0.5, "y": 0.3}（仅新势力填写）]
    }
  ]
}

注意：不要包含event、description等事件描述字段，只需name、power_delta和可选的conquered_by/is_new_faction/direction/nodes。${JSON_OUTPUT_INSTRUCTION}`;

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
        `- ${f.name}（领袖：${f.leader || "未知"}，态度：${f.attitude}，${f.is_external ? "外部" : "内部"}势力）：${f.description}。优势：${f.strength}。弱点：${f.weakness}`,
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

请生成沙盘地图初始布局。注意：各势力坐标必须严格按照其真实地理方位落在对应坐标范围内，且坐标值应随机分布，不要对齐。各势力名称必须与上方列表中的名称完全一致，一个字都不能差。`;

  const systemPrompt = provider.supportsStructuredOutput()
    ? SAND_TABLE_MAP_SYSTEM_PROMPT
    : SAND_TABLE_MAP_SYSTEM_PROMPT;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await provider.sendMessage(messages, {
    responseFormat: "json",
    temperature: 0.7,
    maxTokens: 2048,
    timeout: 45000,
  });

  const result = parseResponse<SandTableMapResult>(response.content, provider);

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

  result.factions = validateAndFixCoordinates(result.factions);

  return result;
}

export async function updateSandTable(
  scenario: ScenarioData,
  currentFactions: FactionData[],
  sandTableFactions: {
    name: string;
    power: number;
    dead: boolean;
    isPlayer: boolean;
    direction?: string;
    nodes?: { x: number; y: number }[];
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
  destroyedFactions?: { name: string; conquered_by?: string }[],
  newFactions?: { name: string; direction?: string }[],
): Promise<SandTableTurnUpdate> {
  const provider = getProvider();

  const aliveFactions = sandTableFactions.filter((f) => !f.dead && !f.isPlayer);

  if (
    aliveFactions.length === 0 &&
    (!newFactions || newFactions.length === 0)
  ) {
    return { factions: [] };
  }

  const factionsState = aliveFactions
    .map(
      (f) =>
        `"${f.name}": {当前力量: ${f.power.toFixed(2)}, 方位: ${f.direction || "未知"}}`,
    )
    .join(", ");

  const occupiedPositions = sandTableFactions
    .filter((f) => !f.dead && f.nodes && f.nodes.length > 0)
    .map((f) =>
      f.nodes!.map((n) => `(${n.x.toFixed(2)},${n.y.toFixed(2)})`).join(","),
    )
    .join("; ");

  const statLabels = {
    stability: "稳定性",
    economy: "经济",
    military: "军事",
    international_standing: "国际声望",
  };

  let destroyedInfo = "";
  if (destroyedFactions && destroyedFactions.length > 0) {
    destroyedInfo = `\n\n本回合被消灭的势力：${destroyedFactions.map((d) => `"${d.name}"${d.conquered_by ? `（被"${d.conquered_by}"吞并）` : ""}`).join("、")}`;
  }

  let newFactionInfo = "";
  if (newFactions && newFactions.length > 0) {
    newFactionInfo = `\n\n本回合出现的新势力：${newFactions.map((n) => `"${n.name}"${n.direction ? `（方位：${n.direction}）` : ""}`).join("、")}`;
  }

  const playerPower =
    1.5 +
    ((currentStats.stability +
      currentStats.economy +
      currentStats.military +
      currentStats.international_standing) /
      4 -
      50) *
      0.03;

  const aliveFactionsDetail = currentFactions
    .filter((f) => !f.is_destroyed && f.is_external !== false)
    .map(
      (f) =>
        `- ${f.name}（态度：${f.attitude}）：优势：${f.strength}，弱点：${f.weakness}`,
    )
    .join("\n");

  const userPrompt = `当前剧本：${scenario.title}
玩家国家：${scenario.player_context.nation_name}
当前回合：第${turnCount}回合
玩家势力当前力量：${playerPower.toFixed(2)}

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

当前存活外部势力状态：{${factionsState}}${destroyedInfo}${newFactionInfo}

各势力强弱详情：
${aliveFactionsDetail}

当前已占据的坐标位置：${occupiedPositions || "无"}

请对本回合事件进行量化评估，返回各外部势力的力量变化。注意：力量变化应基于各势力的强弱基础和本回合事件，态度仅作附加参考。`;

  const systemPrompt = provider.supportsStructuredOutput()
    ? SAND_TABLE_UPDATE_SYSTEM_PROMPT
    : SAND_TABLE_UPDATE_SYSTEM_PROMPT;

  const messages: AIMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const response = await provider.sendMessage(messages, {
    responseFormat: "json",
    temperature: 0.6,
    maxTokens: 1024,
    timeout: 45000,
  });

  const result = parseResponse<SandTableTurnUpdate>(response.content, provider);

  if (!result.factions || !Array.isArray(result.factions)) {
    throw new Error("沙盘更新失败：缺少factions数组");
  }

  return result;
}
