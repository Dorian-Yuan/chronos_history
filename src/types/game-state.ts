import type { ScenarioData, AdvisorRole, AdvisorData } from "./scenario";
import type { TurnResult } from "./turn-result";
import type { EndGameAnalysis } from "./end-game";
import type { PlayStyle } from "./play-style";
import type { LifeMode } from "./life-mode";
import { getAppConfig } from "@/config";

export type GameUniverse = "history" | "life";

export interface GameStats {
  stability: number;
  economy: number;
  military: number;
  international_standing: number;
}

export type GamePhase =
  | "start"
  | "selection"
  | "life_selection"
  | "playing"
  | "ended";

export type BaseOutcome = "victory" | "neutral" | "defeat";

export interface ConditionalOutcome {
  base: BaseOutcome;
  title: string;
  description: string;
}

export interface OutcomeContext {
  stats: GameStats;
  playStyle?: PlayStyle;
  lifeMode?: LifeMode;
  factions: { attitude: string; is_destroyed?: boolean }[];
  turnCount: number;
  playerRank?: number;
}

export interface CounselMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CounselSession {
  advisorRole: AdvisorRole;
  messages: CounselMessage[];
}

export interface CourtDebateMessage {
  role: "user" | "advisor";
  advisorRole?: AdvisorRole;
  advisorName?: string;
  content: string;
  stance?: "support" | "oppose" | "supplement";
}

export interface CourtDebateSession {
  topic: string;
  totalRounds: number;
  currentRound: number;
  messages: CourtDebateMessage[];
  isFinished: boolean;
  turnNumber: number;
}

export interface IdentityChangeCount {
  nation_name: number;
  leader_title: number;
}

export interface GameState {
  phase: GamePhase;
  scenario: ScenarioData | null;
  stats: GameStats;
  turnCount: number;
  historyLog: string[];
  currentTurnResult: TurnResult | null;
  endGameAnalysis: EndGameAnalysis | null;
  turnResults: TurnResult[];
  counselSessions: CounselSession[];
  courtDebateSessions: CourtDebateSession[];
  playerActions: string[];
  currentAdvisors: AdvisorData[];
  identityChangeCount: IdentityChangeCount;
  universe: GameUniverse;
}

export type GameOutcome = BaseOutcome;

export const INITIAL_GAME_STATE: GameState = {
  phase: "start",
  scenario: null,
  stats: {
    stability: 50,
    economy: 50,
    military: 50,
    international_standing: 50,
  },
  turnCount: 0,
  historyLog: [],
  currentTurnResult: null,
  endGameAnalysis: null,
  turnResults: [],
  counselSessions: [],
  courtDebateSessions: [],
  playerActions: [],
  currentAdvisors: [],
  identityChangeCount: { nation_name: 0, leader_title: 0 },
  universe: "history" as GameUniverse,
};

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, value));
}

const PLAY_STYLE_WEIGHTS: Record<
  PlayStyle,
  {
    stability: number;
    economy: number;
    military: number;
    international_standing: number;
  }
> = {
  Conquest: {
    stability: 0.2,
    economy: 0.15,
    military: 0.4,
    international_standing: 0.25,
  },
  Prosperity: {
    stability: 0.2,
    economy: 0.4,
    military: 0.15,
    international_standing: 0.25,
  },
  Reform: {
    stability: 0.3,
    economy: 0.2,
    military: 0.15,
    international_standing: 0.35,
  },
  Survival: {
    stability: 0.25,
    economy: 0.25,
    military: 0.25,
    international_standing: 0.25,
  },
};

function weightedScore(stats: GameStats, playStyle: PlayStyle): number {
  const w = PLAY_STYLE_WEIGHTS[playStyle];
  return (
    stats.stability * w.stability +
    stats.economy * w.economy +
    stats.military * w.military +
    stats.international_standing * w.international_standing
  );
}

const LIFE_MODE_WEIGHTS: Record<
  LifeMode,
  {
    stability: number;
    economy: number;
    military: number;
    international_standing: number;
  }
> = {
  Officialdom: {
    stability: 0.3,
    economy: 0.1,
    military: 0.25,
    international_standing: 0.35,
  },
};

function lifeWeightedScore(stats: GameStats, lifeMode: LifeMode): number {
  const w = LIFE_MODE_WEIGHTS[lifeMode];
  return (
    stats.stability * w.stability +
    stats.economy * w.economy +
    stats.military * w.military +
    stats.international_standing * w.international_standing
  );
}

export function determineOutcome(stats: GameStats): BaseOutcome {
  const anyLow = Object.values(stats).some((v) => v <= 10);
  if (anyLow) return "defeat";
  const avg = Object.values(stats).reduce((a, b) => a + b, 0) / 4;
  if (avg >= 65) return "victory";
  if (avg >= 40) return "neutral";
  return "defeat";
}

function determineLifeConditionalOutcome(
  ctx: OutcomeContext,
): ConditionalOutcome {
  const {
    stats,
    lifeMode = "Officialdom",
    factions,
    turnCount,
    playerRank,
  } = ctx;
  const base = determineOutcome(stats);
  const wScore = lifeWeightedScore(stats, lifeMode);
  const activeFactions = factions.filter((f) => !f.is_destroyed);
  const hostileFactions = activeFactions.filter((f) => f.attitude === "打压");
  const isSpeedRun = turnCount <= 10;
  const isLongRun = turnCount >= 22;

  if (base === "defeat") {
    if (stats.international_standing <= 10) {
      return {
        base: "defeat",
        title: "魂断刑场",
        description:
          "圣眷尽失，上位者震怒。你被押赴刑场，曾经的荣华富贵化为一场空梦。",
      };
    }
    if (stats.international_standing <= 20 && stats.stability <= 20) {
      return {
        base: "defeat",
        title: "贬谪天涯",
        description:
          "一纸诏书，贬谪蛮荒。你带着满腔不甘，踏上了流放之路，再无回朝之日。",
      };
    }
    return {
      base: "defeat",
      title: "身败名裂",
      description:
        "你的仕途走向了终结，曾经的功名利禄如过眼云烟，只留下千古骂名。",
    };
  }

  if (base === "victory") {
    if (
      playerRank !== undefined &&
      playerRank <= 0 &&
      stats.stability >= 75 &&
      stats.international_standing >= 75
    ) {
      return {
        base: "victory",
        title: "只手遮天",
        description:
          "你已位极人臣，权倾朝野。天下大事，皆决于你一人之手，连上位者也要仰你鼻息。",
      };
    }
    if (stats.stability >= 75 && stats.international_standing >= 75) {
      return {
        base: "victory",
        title: "位极人臣",
        description:
          "威望与圣眷并重，你已成为朝堂之上举足轻重的人物，名垂青史。",
      };
    }
    if (
      stats.stability >= 80 &&
      stats.international_standing >= 80 &&
      isSpeedRun
    ) {
      return {
        base: "victory",
        title: "青云直上",
        description:
          "仕途顺遂，平步青云。你在极短时间内便赢得了上位者的信任，堪称传奇。",
      };
    }
    if (
      stats.stability >= 70 &&
      stats.international_standing >= 70 &&
      isLongRun
    ) {
      return {
        base: "victory",
        title: "老成谋国",
        description: "多年宦海沉浮，你以稳健之手辅佐朝政，终成一代名臣。",
      };
    }
    if (wScore >= 70 && hostileFactions.length === 0) {
      return {
        base: "victory",
        title: "朝堂砥柱",
        description:
          "朝堂之上，你稳如磐石。同僚敬服，上位者倚重，你的仕途堪称典范。",
      };
    }
    return {
      base: "victory",
      title: "功成名就",
      description:
        "你的仕途虽非一帆风顺，但终有所成。历史会记住这位勤勉的官员。",
    };
  }

  if (playerRank !== undefined && playerRank <= 3 && stats.stability >= 55) {
    return {
      base: "neutral",
      title: "中流砥柱",
      description:
        "身居高位，虽非权倾朝野，却也稳如泰山。你是朝堂上不可或缺的柱石。",
    };
  }
  if (stats.international_standing >= 60 && stats.stability < 40) {
    return {
      base: "neutral",
      title: "伴驾之臣",
      description: "圣眷虽隆，却根基不稳。你在上位者身边如履薄冰，前途未卜。",
    };
  }
  if (
    playerRank !== undefined &&
    playerRank >= 5 &&
    stats.international_standing >= 50
  ) {
    return {
      base: "neutral",
      title: "安守本分",
      description:
        "品级不高，却也得上位者青睐。你安分守己，在官场中找到了自己的位置。",
    };
  }
  if (wScore >= 35) {
    return {
      base: "neutral",
      title: "随波逐流",
      description:
        "宦海沉浮，你既非最耀眼的那颗星，也非最暗淡的那粒尘。历史对你只是轻轻一瞥。",
    };
  }
  return {
    base: "neutral",
    title: "浮沉不定",
    description: "仕途坎坷，时好时坏。你仍在宦海中挣扎，前路茫茫。",
  };
}

export function determineConditionalOutcome(
  ctx: OutcomeContext,
): ConditionalOutcome {
  if (ctx.lifeMode) {
    return determineLifeConditionalOutcome(ctx);
  }

  const { stats, playStyle = "Survival", factions, turnCount } = ctx;
  const base = determineOutcome(stats);
  const wScore = weightedScore(stats, playStyle);
  const activeFactions = factions.filter((f) => !f.is_destroyed);
  const hostileFactions = activeFactions.filter((f) => f.attitude === "敌对");
  const submittedFactions = activeFactions.filter((f) => f.attitude === "臣服");
  const friendlyFactions = activeFactions.filter((f) => f.attitude === "友好");
  const isSpeedRun = turnCount <= 10;
  const isLongRun = turnCount >= 22;

  if (base === "defeat") {
    if (playStyle === "Survival" && wScore >= 35) {
      return {
        base: "neutral",
        title: "绝境苟存",
        description:
          "虽然国家千疮百孔，但你在绝境中守住了最后的火种。历史不会忘记这份坚韧。",
      };
    }
    if (hostileFactions.length === 0 && wScore >= 30) {
      return {
        base: "neutral",
        title: "困兽犹斗",
        description: "外敌虽已平息，但内忧深重。你的统治在风雨飘摇中勉强维系。",
      };
    }
    return {
      base: "defeat",
      title: "国破家亡",
      description:
        "你的统治走向了终结，历史的车轮碾过你的王朝，只留下断壁残垣。",
    };
  }

  if (base === "victory") {
    if (
      playStyle === "Conquest" &&
      stats.military >= 75 &&
      submittedFactions.length >= 2
    ) {
      return {
        base: "victory",
        title: "铁血征服者",
        description:
          "以武力铸就帝国，万邦来朝。你的名字将刻在征服者的丰碑上，与亚历山大、凯撒并列。",
      };
    }
    if (
      playStyle === "Prosperity" &&
      stats.economy >= 75 &&
      friendlyFactions.length >= 2
    ) {
      return {
        base: "victory",
        title: "商业帝国缔造者",
        description:
          "财富如潮水般涌入国库，贸易网络遍布天下。你开创了一个前所未有的繁荣时代。",
      };
    }
    if (
      playStyle === "Reform" &&
      stats.stability >= 70 &&
      stats.international_standing >= 70
    ) {
      return {
        base: "victory",
        title: "文明变革先驱",
        description:
          "改革之风吹遍大地，你的国家成为文明与进步的灯塔。后世史家将你视为开创新纪元的伟人。",
      };
    }
    if (
      playStyle === "Survival" &&
      stats.stability >= 60 &&
      stats.economy >= 60
    ) {
      return {
        base: "victory",
        title: "力挽狂澜",
        description:
          "从崩溃边缘到重振国威，你完成了不可能的逆转。这是属于坚韧者的胜利。",
      };
    }
    if (wScore >= 70 && hostileFactions.length === 0) {
      return {
        base: "victory",
        title: "盛世明君",
        description: "四海升平，万民乐业。你的统治被后世视为黄金时代的典范。",
      };
    }
    if (isSpeedRun) {
      return {
        base: "victory",
        title: "速决之主",
        description:
          "雷厉风行，速战速决。你在极短时间内稳定了局势，展现了非凡的决断力。",
      };
    }
    if (isLongRun) {
      return {
        base: "victory",
        title: "守成之君",
        description:
          "漫长的统治考验了你的耐心与智慧。最终，你以稳健之手守护了国家的安宁。",
      };
    }
    return {
      base: "victory",
      title: "胜利者",
      description: "你的统治为这个国家带来了转机，历史将铭记你的功绩。",
    };
  }

  if (
    playStyle === "Conquest" &&
    stats.military >= 60 &&
    hostileFactions.length > 0
  ) {
    return {
      base: "neutral",
      title: "未竟之征",
      description:
        "军事力量尚存，但征服之路远未结束。历史给了你机会，却未给你足够的时间。",
    };
  }
  if (playStyle === "Prosperity" && stats.economy >= 60) {
    return {
      base: "neutral",
      title: "半壁繁华",
      description:
        "经济基础已然奠定，但距离真正的繁荣尚有差距。你的遗产是一座未完工的大厦。",
    };
  }
  if (playStyle === "Reform" && stats.international_standing >= 55) {
    return {
      base: "neutral",
      title: "改革未半",
      description:
        "变革的种子已经播下，但收获尚需时日。你是一个走在正确道路上的先行者。",
    };
  }
  if (playStyle === "Survival" && wScore >= 35) {
    return {
      base: "neutral",
      title: "风雨飘摇",
      description:
        "国家在崩溃边缘苦苦支撑，你勉强保住了统治，但前路依然荆棘密布。",
    };
  }
  return {
    base: "neutral",
    title: "存续之主",
    description:
      "不好不坏，不温不火。你的统治既非辉煌也非灾难，历史对你只是轻轻一瞥。",
  };
}

export function checkGameOver(
  state: GameState,
  turnResult: TurnResult,
): boolean {
  const config = getAppConfig();
  const nextTurn = state.turnCount + 1;
  const anyStatLow = Object.values(state.stats).some((v) => v <= 10);
  const hardCap = nextTurn > config.maxTurns;
  const collapse = anyStatLow && nextTurn > config.minTurnsBeforeEnd;
  const aiEnded =
    turnResult.is_game_over && nextTurn > config.minTurnsBeforeEnd;
  const perfectVictory = Object.values(state.stats).every((v) => v >= 95);
  return hardCap || collapse || aiEnded || perfectVictory;
}
