export const scenarioCoreSchema = {
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
          description:
            "玩家头衔（如皇帝、国王、执政官、总督、大公、首相、摄政王、城邦领主等）",
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
    start_date: {
      type: "string" as const,
      description: "中文日期字符串（风格与时代一致，如中国朝代用年号格式）",
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
  ],
};

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
          description:
            "玩家头衔（如皇帝、国王、执政官、总督、大公、首相、摄政王、城邦领主等）",
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
    start_date: {
      type: "string" as const,
      description: "中文日期字符串（风格与时代一致，如中国朝代用年号格式）",
    },
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
          name: {
            type: "string" as const,
            description:
              "真实人名（禁止奇幻风格，中国用姓+名如'陈伯年'，欧洲用名+姓，禁止'铁牙''影爪'等）",
          },
          advice: { type: "string" as const, description: "建议（简体中文）" },
          bias: {
            type: "string" as const,
            description:
              "倾向（前4字为核心总结，共15字以内，如'主战派：主张以武力解决'）",
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
          name: {
            type: "string" as const,
            description:
              "2字势力简称（必须真实可信，禁止奇幻风格如'暗影''血月'）",
          },
          description: {
            type: "string" as const,
            description:
              "势力描述（Conquest以外国势力为主，Prosperity以经济集团为主，Reform以内部政治力量为主，Survival内外兼有）",
          },
          strength: { type: "string" as const, description: "主要优势" },
          weakness: { type: "string" as const, description: "关键弱点" },
          needs: { type: "string" as const, description: "急需什么" },
          attitude: { type: "string" as const, description: "当前立场" },
          leader: {
            type: "string" as const,
            description:
              "势力领袖姓名（必须符合对应文明的命名传统，与顾问命名规则一致，禁止奇幻风格）",
          },
        },
        required: [
          "name",
          "description",
          "strength",
          "weakness",
          "needs",
          "attitude",
          "leader",
        ],
      },
    },
    initial_decision_options: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          title: {
            type: "string" as const,
            description: "决策选项标题（简体中文，2-6字）",
          },
          description: {
            type: "string" as const,
            description: "决策选项简述（简体中文，30-60字）",
          },
          recommended_advisor: {
            type: "string" as const,
            description: "推荐此选择的顾问角色名（如'将军''外交官'）",
          },
        },
        required: ["title", "description", "recommended_advisor"],
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
    "initial_decision_options",
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
    historian_commentary: {
      type: "string" as const,
      description:
        "史官注疏：以后世史官视角，用文言或半文言风格评价本回合决策，暗含褒贬，偶尔暗示未来事件（简体中文，50-100字）",
    },
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
          bias: {
            type: "string" as const,
            description:
              "倾向（前4字为核心总结，共15字以内，如'主战派：主张以武力解决'）",
          },
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
          leader: { type: "string" as const },
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
          "leader",
        ],
      },
    },
    hidden_consequences: {
      type: "string" as const,
      description:
        "回合总结（AI长期记忆）。必须明确记录：1)派系镇压/清理的累积次数和效果 2)派系态度变化的关键节点 3)玩家对某派系的持续政策 4)未解决的隐患。绝对禁止遗漏重要的派系状态变化",
    },
    decision_options: {
      type: "array" as const,
      items: {
        type: "object" as const,
        additionalProperties: false,
        properties: {
          title: {
            type: "string" as const,
            description: "决策选项标题（简体中文，2-6字）",
          },
          description: {
            type: "string" as const,
            description: "决策选项简述（简体中文，30-60字）",
          },
          recommended_advisor: {
            type: "string" as const,
            description: "推荐此选择的顾问角色名（如'将军''外交官'）",
          },
        },
        required: ["title", "description", "recommended_advisor"],
      },
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
    "historian_commentary",
    "stats_delta",
    "advisors",
    "factions_update",
    "hidden_consequences",
    "decision_options",
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
    modern_echo: {
      type: "string" as const,
      description:
        "现代视角叙事：从2026年的视角回望玩家统治的历史影响（简体中文，100-200字）",
    },
    alternative_history: {
      type: "string" as const,
      description:
        "平行历史演化：推演在玩家统治下，该国未来50年的蝴蝶效应发展路径（简体中文，200-400字）",
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
    "modern_echo",
    "alternative_history",
  ],
};

export const counselSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    response: {
      type: "string" as const,
      description: "顾问的私下回应（简体中文，100-200字）",
    },
  },
  required: ["response"],
};

export const courtDebateSchema = {
  type: "object" as const,
  additionalProperties: false,
  properties: {
    speaker_role: {
      type: "string" as const,
      enum: ["General", "Diplomat", "Intel", "Scholar", "Merchant"],
    },
    speaker_name: { type: "string" as const },
    stance: {
      type: "string" as const,
      enum: ["support", "oppose", "supplement"],
    },
    content: {
      type: "string" as const,
      description: "廷议发言（简体中文，80-150字）",
    },
  },
  required: ["speaker_role", "speaker_name", "stance", "content"],
};
