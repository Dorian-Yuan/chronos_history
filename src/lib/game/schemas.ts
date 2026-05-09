export const scenarioSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    id: { type: "string" as const },
    title: { type: "string" as const, description: "4字中文标题" },
    description: {
      type: "string" as const,
      description: "匿名化的情境描述（简体中文）",
    },
    player_context: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        nation_name: {
          type: "string" as const,
          description: "玩家国家/派系名称",
        },
        leader_title: {
          type: "string" as const,
          description: "玩家头衔（如皇帝、总督、执行官）",
        },
        background_summary: {
          type: "string" as const,
          description: "背景简介",
        },
      },
      required: ["nation_name", "leader_title", "background_summary"],
    },
    initial_stats: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        stability: { type: "number" as const, minimum: 0, maximum: 100 },
        economy: { type: "number" as const, minimum: 0, maximum: 100 },
        military: { type: "number" as const, minimum: 0, maximum: 100 },
        international_standing: {
          type: "number" as const,
          minimum: 0,
          maximum: 100,
        },
      },
      required: ["stability", "economy", "military", "international_standing"],
    },
    hidden_real_event: {
      type: "string" as const,
      description: "真实历史事件名称（隐藏，结局揭示）",
    },
    play_style: {
      type: "string" as const,
      enum: ["Conquest", "Prosperity", "Reform", "Survival"],
    },
    start_date: { type: "string" as const, description: "中文日期字符串" },
    initial_advisors: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          role: {
            type: "string" as const,
            enum: ["General", "Diplomat", "Intel", "Scholar", "Merchant"],
          },
          name: { type: "string" as const, description: "中文名" },
          advice: { type: "string" as const, description: "建议（简体中文）" },
          bias: {
            type: "string" as const,
            description: "倾向描述（简体中文）",
          },
        },
        required: ["role", "name", "advice", "bias"],
      },
    },
    factions: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          name: { type: "string" as const, description: "2字简称" },
          description: {
            type: "string" as const,
            description: "地理/氛围描述",
          },
          strength: { type: "string" as const, description: "主要优势" },
          weakness: { type: "string" as const, description: "关键弱点" },
          needs: { type: "string" as const, description: "急需什么" },
          attitude: { type: "string" as const, description: "当前立场" },
        },
        required: [
          "name",
          "description",
          "strength",
          "weakness",
          "needs",
          "attitude",
        ],
      },
    },
  },
  required: [
    "id",
    "title",
    "description",
    "player_context",
    "initial_stats",
    "hidden_real_event",
    "play_style",
    "start_date",
    "initial_advisors",
    "factions",
  ],
};

export const turnResultSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    narrative: {
      type: "string" as const,
      description: "用户行动的直接后果（创意性描述）",
    },
    situation_update: { type: "string" as const, description: "新挑战/危机" },
    date_display: { type: "string" as const, description: "当前相对日期" },
    headline: {
      type: "string" as const,
      description: "报纸/诏令标题（简体中文）",
    },
    rumor: { type: "string" as const, description: "民间流言（简体中文）" },
    stats_delta: {
      type: "object" as const,
      additionalProperties: false,
      properties: {
        stability: { type: "number" as const, minimum: -10, maximum: 10 },
        economy: { type: "number" as const, minimum: -10, maximum: 10 },
        military: { type: "number" as const, minimum: -10, maximum: 10 },
        international_standing: {
          type: "number" as const,
          minimum: -10,
          maximum: 10,
        },
      },
      required: ["stability", "economy", "military", "international_standing"],
    },
    advisors: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          role: {
            type: "string" as const,
            enum: ["General", "Diplomat", "Intel", "Scholar", "Merchant"],
          },
          name: { type: "string" as const },
          advice: { type: "string" as const },
          bias: { type: "string" as const },
          hidden_motive: { type: "string" as const },
        },
        required: ["role", "name", "advice", "bias"],
      },
    },
    factions_update: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          name: { type: "string" as const },
          description: { type: "string" as const },
          strength: { type: "string" as const },
          weakness: { type: "string" as const },
          needs: { type: "string" as const },
          attitude: { type: "string" as const },
          is_new: { type: "boolean" as const },
          is_destroyed: { type: "boolean" as const },
        },
        required: [
          "name",
          "description",
          "strength",
          "weakness",
          "needs",
          "attitude",
          "is_new",
          "is_destroyed",
        ],
      },
    },
    hidden_consequences: {
      type: "string" as const,
      description: "回合总结（AI长期记忆）",
    },
    is_game_over: { type: "boolean" as const },
    game_over_reason: {
      type: "string" as const,
      description: "结束原因（简体中文）",
    },
  },
  required: [
    "narrative",
    "situation_update",
    "date_display",
    "headline",
    "rumor",
    "stats_delta",
    "advisors",
    "factions_update",
    "hidden_consequences",
    "is_game_over",
  ],
};

export const analysisSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    real_event_title: { type: "string" as const },
    real_outcome_summary: { type: "string" as const },
    user_outcome_summary: { type: "string" as const },
    comparison_text: { type: "string" as const },
    similar_historical_figure: { type: "string" as const },
    persona_title: {
      type: "string" as const,
      description: '如"开明的独裁者"、"商业巨擘"',
    },
    persona_description: { type: "string" as const },
    radar_stats: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          dimension: {
            type: "string" as const,
            enum: ["Authority", "Strategy", "Empathy", "Vision", "Economy"],
          },
          value: { type: "number" as const, minimum: 0, maximum: 100 },
          fullMark: { type: "number" as const },
        },
        required: ["dimension", "value", "fullMark"],
      },
    },
    turn_reviews: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          turn: { type: "number" as const },
          summary: { type: "string" as const },
          commentary: { type: "string" as const },
        },
        required: ["turn", "summary", "commentary"],
      },
    },
  },
  required: [
    "real_event_title",
    "real_outcome_summary",
    "user_outcome_summary",
    "comparison_text",
    "similar_historical_figure",
    "persona_title",
    "persona_description",
    "radar_stats",
    "turn_reviews",
  ],
};
