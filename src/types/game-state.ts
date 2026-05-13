import type { ScenarioData, AdvisorRole, AdvisorData } from "./scenario";
import type { TurnResult } from "./turn-result";
import type { EndGameAnalysis } from "./end-game";
import type { PlayStyle } from "./play-style";
import { getAppConfig } from "@/config";

export interface GameStats {
  stability: number;
  economy: number;
  military: number;
  international_standing: number;
}

export type GamePhase = "start" | "selection" | "playing" | "ended";

export type BaseOutcome = "victory" | "neutral" | "defeat";

export interface ConditionalOutcome {
  base: BaseOutcome;
  title: string;
  description: string;
}

export interface OutcomeContext {
  stats: GameStats;
  playStyle: PlayStyle;
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
  Officialdom: {
    stability: 0.3,
    economy: 0.1,
    military: 0.25,
    international_standing: 0.35,
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

export function determineOutcome(stats: GameStats): BaseOutcome {
  const anyLow = Object.values(stats).some((v) => v <= 10);
  if (anyLow) return "defeat";
  const avg = Object.values(stats).reduce((a, b) => a + b, 0) / 4;
  if (avg >= 65) return "victory";
  if (avg >= 40) return "neutral";
  return "defeat";
}

export function determineConditionalOutcome(
  ctx: OutcomeContext,
): ConditionalOutcome {
  const { stats, playStyle, factions, turnCount } = ctx;
  const base = determineOutcome(stats);
  const wScore = weightedScore(stats, playStyle);
  const activeFactions = factions.filter((f) => !f.is_destroyed);
  const hostileFactions = activeFactions.filter((f) => f.attitude === "敌对");
  const submittedFactions = activeFactions.filter((f) => f.attitude === "臣服");
  const friendlyFactions = activeFactions.filter((f) => f.attitude === "友好");
  const isSpeedRun = turnCount <= 10;
  const isLongRun = turnCount >= 22;

  if (base === "defeat") {
    if (playStyle === "Officialdom" && stats.international_standing <= 10) {
      return {
        base: "defeat",
        title: "魂断刑场",
        description:
          "触怒天颜，身首异处。你的名字成为后世的警示，史书上只留下寥寥数语。",
      };
    }
    if (
      playStyle === "Officialdom" &&
      stats.international_standing <= 20 &&
      stats.stability <= 20
    ) {
      return {
        base: "defeat",
        title: "贬谪天涯",
        description:
          "一纸诏书，万劫不复。你被流放至蛮荒之地，再无翻身之日，只能在异乡遥望故土。",
      };
    }
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
      title: playStyle === "Officialdom" ? "身败名裂" : "国破家亡",
      description:
        playStyle === "Officialdom"
          ? "官场失意，身败名裂。你的仕途以最不堪的方式画上了句号，后人提及唯有叹息。"
          : "你的统治走向了终结，历史的车轮碾过你的王朝，只留下断壁残垣。",
    };
  }

  if (base === "victory") {
    if (
      playStyle === "Officialdom" &&
      stats.stability >= 75 &&
      stats.international_standing >= 75
    ) {
      const rank = ctx.playerRank;
      if (rank !== undefined && rank <= 0) {
        return {
          base: "victory",
          title: "只手遮天",
          description:
            "摄政天下，权倾朝野。你已超越了臣子的极限，成为帝国真正的掌舵者。史书将你与霍光、曹操并列。",
        };
      }
      return {
        base: "victory",
        title: "位极人臣",
        description:
          "一人之下，万人之上。你从微末小吏走到了权力的巅峰，成为一代名臣。后世史家将你与管仲、诸葛亮并论。",
      };
    }
    if (
      playStyle === "Officialdom" &&
      stats.stability >= 80 &&
      stats.international_standing >= 80 &&
      isSpeedRun
    ) {
      return {
        base: "victory",
        title: "青云直上",
        description:
          "平步青云，势不可挡。你以惊人的速度攀上高位，令朝野侧目。如此际遇，百年难遇。",
      };
    }
    if (
      playStyle === "Officialdom" &&
      stats.stability >= 70 &&
      stats.international_standing >= 70 &&
      isLongRun
    ) {
      return {
        base: "victory",
        title: "老成谋国",
        description:
          "历经沉浮，终成栋梁。你用时间和智慧证明了自己的价值，成为朝廷不可或缺的定海神针。",
      };
    }
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

  if (playStyle === "Officialdom" && stats.stability >= 55) {
    const rank = ctx.playerRank;
    if (rank !== undefined && rank <= 3) {
      return {
        base: "neutral",
        title: "中流砥柱",
        description:
          "你在朝堂上站稳了脚跟，虽未至巅峰，却也是不可或缺的重臣。后人评说，你是那个时代的脊梁。",
      };
    }
    if (stats.international_standing >= 60 && stats.stability < 40) {
      return {
        base: "neutral",
        title: "伴驾之臣",
        description:
          "深得上意，却无实权。你是上位者信任的近臣，却永远走不到台前。荣华富贵皆有，唯独缺少真正的力量。",
      };
    }
    if (rank !== undefined && rank >= 5 && stats.international_standing >= 50) {
      return {
        base: "neutral",
        title: "安守本分",
        description:
          "不求闻达于诸侯，但求无过于当下。你选择了一条安稳的仕途，虽无大功，亦无大过。",
      };
    }
    return {
      base: "neutral",
      title: "随波逐流",
      description:
        "宦海浮沉，起起落落。你既非权臣，也非庸吏，只是官场中普通的一员，随波逐流而已。",
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
