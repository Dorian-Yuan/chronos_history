
// <define:process.env>
var define_process_env_default = { NODE_ENV: "production", API_KEY: "gapp-proxy-key", GEMINI_API_KEY: "gapp-proxy-key", GOOGLE_API_KEY: "gapp-proxy-key", GOOGLE_GENERATIVE_AI_API_KEY: "gapp-proxy-key", VITE_API_KEY: "gapp-proxy-key", VITE_GEMINI_API_KEY: "gapp-proxy-key", OPENAI_API_KEY: "gapp-proxy-key", ANTHROPIC_API_KEY: "gapp-proxy-key" };

// virtual:index.tsx
import React5 from "react";
import ReactDOM from "react-dom/client";

// virtual:App.tsx
import { useState as useState4, useReducer, useEffect as useEffect4 } from "react";

// virtual:services/geminiService.ts
import { GoogleGenAI, Type } from "@google/genai";

// virtual:services/contentFilter.ts
var SENSITIVE_WORDS = [
  // ===== 政治运动/事件 =====
  "\u516D\u56DB",
  "\u5929\u5B89\u95E8\u4E8B\u4EF6",
  "\u516B\u4E5D\u6C11\u8FD0",
  "\u516B\u4E5D\u5B66\u8FD0",
  "\u6587\u5316\u5927\u9769\u547D",
  "\u6587\u9769",
  "\u7EA2\u536B\u5175",
  "\u56DB\u4EBA\u5E2E",
  "\u9020\u53CD\u6D3E",
  "\u5927\u8DC3\u8FDB",
  "\u53CD\u53F3",
  "\u53CD\u53F3\u6D3E",
  "\u6574\u98CE\u8FD0\u52A8",
  "\u5EF6\u5B89\u6574\u98CE",
  "\u4E09\u53CD\u4E94\u53CD",
  "\u9547\u53CD",
  "\u8083\u53CD",
  "\u53CD\u8D44\u4EA7\u9636\u7EA7\u81EA\u7531\u5316",
  "\u6E05\u9664\u7CBE\u795E\u6C61\u67D3",
  "\u96F6\u516B\u5BAA\u7AE0",
  "\u767D\u7EB8\u8FD0\u52A8",
  "\u767D\u7EB8\u9769\u547D",
  "\u8309\u8389\u82B1\u9769\u547D",
  "913\u4E8B\u4EF6",
  "\u6797\u5F6A\u51FA\u9003",
  "\u6279\u6797\u6279\u5B54",
  "\u4E0A\u5C71\u4E0B\u4E61",
  "\u77E5\u9752\u4E0B\u4E61",
  "\u4EBA\u6C11\u516C\u793E",
  "\u4E09\u5E74\u81EA\u7136\u707E\u5BB3",
  "\u4E09\u5E74\u9965\u8352",
  "\u5927\u9965\u8352",
  "\u516C\u79C1\u5408\u8425",
  "\u793E\u4F1A\u4E3B\u4E49\u6539\u9020",
  "\u4E25\u6253",
  "\u8BA1\u5212\u751F\u80B2\u5F3A\u5236",
  "\u5F3A\u5236\u5815\u80CE",
  "\u65B0\u7586\u518D\u6559\u80B2\u8425",
  "\u518D\u6559\u80B2\u8425",
  "\u96C6\u4E2D\u8425",
  "\u9999\u6E2F\u56FD\u5B89\u6CD5",
  "\u53CD\u9001\u4E2D",
  "\u5360\u4E2D",
  "\u96E8\u4F1E\u8FD0\u52A8",
  "\u94C1\u94FE\u5973",
  "\u5F90\u5DDE\u516B\u5B69",
  "\u5F6D\u5E05\u4E8B\u4EF6",
  "\u571F\u6539\u6279\u6597",
  "\u5730\u4E3B\u6279\u6597",
  // ===== 人物 =====
  "\u4E60\u8FD1\u5E73",
  "\u674E\u5F3A",
  "\u738B\u6CAA\u5B81",
  "\u674E\u514B\u5F3A",
  "\u5218\u6653\u6CE2",
  "\u827E\u672A\u672A",
  "\u8D75\u7D2B\u9633",
  "\u80E1\u8000\u90A6",
  "\u6797\u5F6A",
  "\u5F6D\u5FB7\u6000",
  "\u9AD8\u5C97",
  "\u9976\u6F31\u77F3",
  "\u8FBE\u8D56",
  "\u8FBE\u8D56\u5587\u561B",
  "\u70ED\u6BD4\u5A05",
  "\u738B\u4E39",
  "\u543E\u5C14\u5F00\u5E0C",
  "\u67F4\u73B2",
  // ===== 领土/分裂 =====
  "\u53F0\u72EC",
  "\u85CF\u72EC",
  "\u7586\u72EC",
  "\u6E2F\u72EC",
  "\u8499\u72EC",
  "\u4E1C\u7A81",
  "\u4E1C\u7A81\u53A5\u65AF\u5766",
  "\u85CF\u5357",
  "\u963F\u9C81\u7EB3\u6070\u5C14",
  "\u5357\u6D77\u4EF2\u88C1",
  "\u4E5D\u6BB5\u7EBF\u4E89\u8BAE",
  "\u4E2D\u5370\u51B2\u7A81",
  "\u52A0\u52D2\u4E07\u6CB3\u8C37",
  "\u9493\u9C7C\u5C9B\u4E89\u7AEF",
  "\u5C16\u9601\u8BF8\u5C9B",
  // ===== 组织 =====
  "\u6CD5\u8F6E\u529F",
  "\u6CD5\u8F6E\u5927\u6CD5",
  "\u5168\u80FD\u795E",
  "\u6C11\u8FD0\u7EC4\u7EC7",
  "\u6D41\u4EA1\u653F\u5E9C",
  "\u897F\u85CF\u6D41\u4EA1\u653F\u5E9C",
  // ===== 暗语/谐音/影射 =====
  "8964",
  "\u4E94\u6708\u4E09\u5341\u4E94",
  "35\u67085\u65E5",
  "\u7EF4\u5C3C",
  "\u5C0F\u718A\u7EF4\u5C3C",
  "\u5657\u5657\u718A",
  "\u5E86\u4E30",
  "\u5E86\u4E30\u5E1D",
  "\u5305\u5B50",
  "\u4E60\u5305\u5B50",
  "\u5766\u514B\u4EBA",
  "\u738B\u7EF4\u6797",
  "\u7FFB\u5899",
  "\u9632\u706B\u957F\u57CE",
  "GFW",
  "404",
  // ===== 境外势力相关 =====
  "\u5883\u5916\u52BF\u529B",
  "\u53CD\u534E\u52BF\u529B",
  "\u7F8E\u56FD\u4E2D\u60C5\u5C40",
  "NED",
  "\u7D22\u7F57\u65AF",
  "\u90ED\u6587\u8D35",
  "\u73ED\u519C"
];
function checkSensitiveContent(text) {
  const lowerText = text.toLowerCase();
  for (const word of SENSITIVE_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}
function checkObjectForSensitiveContent(obj) {
  const jsonStr = JSON.stringify(obj);
  return checkSensitiveContent(jsonStr);
}

// virtual:services/geminiService.ts
var apiKey = import.meta.env?.VITE_GEMINI_API_KEY || define_process_env_default.API_KEY || define_process_env_default.GEMINI_API_KEY || "";
var MAX_RETRIES = 3;
var getAI = () => new GoogleGenAI({ apiKey });
var turnResultSchema = {
  type: Type.OBJECT,
  properties: {
    narrative: { type: Type.STRING, description: "The direct CONSEQUENCE of the user's action. Be creative. If the user uses non-military means (culture, economy, tech), simulate those effects logically." },
    situation_update: { type: Type.STRING, description: "The NEW CHALLENGE. It can be a military threat, but ALSO consider economic crashes, religious schisms, technological disruptions, or diplomatic scandals. Must be urgent." },
    date_display: { type: Type.STRING, description: "Current relative date, e.g., '1898\u5E74 \u620A\u620C\u590F' or '\u5171\u548C\u56FD\u5386 3\u5E74' (In Simplified Chinese)" },
    headline: { type: Type.STRING, description: "A punchy newspaper/edict headline. (In Simplified Chinese)" },
    rumor: { type: Type.STRING, description: "A rumor circulating among the populace/court. (In Simplified Chinese)" },
    stats_delta: {
      type: Type.OBJECT,
      properties: {
        stability: { type: Type.INTEGER },
        economy: { type: Type.INTEGER },
        military: { type: Type.INTEGER },
        international_standing: { type: Type.INTEGER }
      },
      required: ["stability", "economy", "military", "international_standing"]
    },
    advisors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING, enum: ["General", "Diplomat", "Intel", "Scholar", "Merchant"] },
          name: { type: Type.STRING, description: "Chinese name" },
          advice: { type: Type.STRING, description: "Advice on the NEW SITUATION. Advisors have PERSONAL BIASES and HIDDEN AGENDAS. Their advice may be self-serving or short-sighted. General wants war, Merchant wants profit, Scholar is conservative." },
          bias: { type: Type.STRING, description: "Bias description in Simplified Chinese" },
          hidden_motive: { type: Type.STRING, description: "The advisor's secret agenda (e.g. '\u60F3\u501F\u6B64\u6269\u5927\u519B\u6743', '\u6709\u5546\u4E1A\u5229\u76CA\u5173\u8054'). In Simplified Chinese." }
        },
        required: ["role", "name", "advice", "bias"]
      }
    },
    factions_update: {
      type: Type.ARRAY,
      description: "Updated faction list. Include ALL current factions (existing + new). Remove destroyed factions. Update attitudes based on player actions.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Short 2-char name" },
          description: { type: Type.STRING, description: "Geography/Vibe" },
          strength: { type: Type.STRING, description: "Main advantage" },
          weakness: { type: Type.STRING, description: "Critical flaw" },
          needs: { type: Type.STRING, description: "What do they need?" },
          attitude: { type: Type.STRING, description: "Current stance towards player (e.g. '\u654C\u5BF9', '\u6C42\u548C', '\u4E2D\u7ACB', '\u53CB\u597D', '\u81E3\u670D', '\u5DF2\u706D\u4EA1')" },
          is_new: { type: Type.BOOLEAN, description: "True if this faction just appeared this turn" },
          is_destroyed: { type: Type.BOOLEAN, description: "True if this faction was just destroyed" }
        },
        required: ["name", "description", "strength", "weakness", "needs", "attitude"]
      }
    },
    hidden_consequences: { type: Type.STRING, description: "A summary of the turn for the AI's long-term memory." },
    is_game_over: { type: Type.BOOLEAN },
    game_over_reason: { type: Type.STRING, description: "Reason in Simplified Chinese" }
  },
  required: ["narrative", "situation_update", "headline", "stats_delta", "advisors", "factions_update", "hidden_consequences", "is_game_over"]
};
var scenarioSchema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING, description: "Short 4-character Title in Simplified Chinese" },
    description: { type: Type.STRING, description: "The anonymized situation description in Simplified Chinese." },
    player_context: {
      type: Type.OBJECT,
      properties: {
        nation_name: { type: Type.STRING, description: "The name of the player's country/faction (e.g. '\u5927\u695A\u5E1D\u56FD', '\u4F5B\u7F57\u4F26\u8428\u5171\u548C\u56FD', '\u9769\u547D\u519B\u603B\u90E8')." },
        leader_title: { type: Type.STRING, description: "The player's title (e.g. '\u7687\u5E1D', '\u603B\u7763', '\u6267\u884C\u5B98')." },
        background_summary: { type: Type.STRING, description: "Who are we? What is our history? (Briefly)." }
      },
      required: ["nation_name", "leader_title", "background_summary"]
    },
    initial_stats: {
      type: Type.OBJECT,
      description: "Set initial stats (0-100) based on the requested Play Style.",
      properties: {
        stability: { type: Type.INTEGER },
        economy: { type: Type.INTEGER },
        military: { type: Type.INTEGER },
        international_standing: { type: Type.INTEGER }
      },
      required: ["stability", "economy", "military", "international_standing"]
    },
    hidden_real_event: { type: Type.STRING, description: "The actual historical event name in Simplified Chinese." },
    play_style: { type: Type.STRING, description: "The play style archetype (Conquest/Prosperity/Reform/Survival)" },
    start_date: { type: Type.STRING, description: "Date string in Simplified Chinese" },
    initial_advisors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING, enum: ["General", "Diplomat", "Intel", "Scholar", "Merchant"] },
          name: { type: Type.STRING, description: "Chinese name" },
          advice: { type: Type.STRING, description: "Advice in Simplified Chinese" },
          bias: { type: Type.STRING, description: "Bias in Simplified Chinese" }
        }
      }
    },
    factions: {
      type: Type.ARRAY,
      description: "List of 2-3 key external entities (neighbors, enemies, trade partners, religious sects)",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Short 2-char name e.g. '\u6559\u4F1A', '\u5546\u76DF', '\u5317\u72C4'" },
          description: { type: Type.STRING, description: "Geography/Vibe" },
          strength: { type: Type.STRING, description: "Main advantage e.g. 'Monopoly on Salt', 'Fanaticism'" },
          weakness: { type: Type.STRING, description: "Critical flaw e.g. 'Inflation', 'Heretics'" },
          needs: { type: Type.STRING, description: "What do they desperately need?" },
          attitude: { type: Type.STRING, description: "Current stance" }
        },
        required: ["name", "description", "strength", "weakness", "needs", "attitude"]
      }
    }
  },
  required: ["title", "description", "player_context", "initial_stats", "hidden_real_event", "play_style", "initial_advisors", "factions"]
};
var analysisSchema = {
  type: Type.OBJECT,
  properties: {
    real_event_title: { type: Type.STRING, description: "In Simplified Chinese" },
    real_outcome_summary: { type: Type.STRING, description: "In Simplified Chinese" },
    user_outcome_summary: { type: Type.STRING, description: "In Simplified Chinese" },
    comparison_text: { type: Type.STRING, description: "Comparing user timeline vs real history (What If) in Simplified Chinese." },
    similar_historical_figure: { type: Type.STRING, description: "In Simplified Chinese" },
    persona_title: { type: Type.STRING, description: "e.g., '\u5F00\u660E\u7684\u72EC\u88C1\u8005', '\u5546\u4E1A\u5DE8\u64D8', '\u6587\u5316\u5723\u4EBA' In Simplified Chinese" },
    persona_description: { type: Type.STRING, description: "In Simplified Chinese" },
    radar_stats: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dimension: { type: Type.STRING, enum: ["Authority", "Strategy", "Empathy", "Vision", "Economy"] },
          value: { type: Type.INTEGER, description: "0 to 100" },
          fullMark: { type: Type.INTEGER }
        }
      }
    },
    turn_reviews: {
      type: Type.ARRAY,
      description: "Per-turn strategic review of the player's decisions",
      items: {
        type: Type.OBJECT,
        properties: {
          turn: { type: Type.INTEGER, description: "Turn number" },
          summary: { type: Type.STRING, description: "What the player did this turn (brief, in Simplified Chinese)" },
          commentary: { type: Type.STRING, description: "Strategic critique: was it wise? What could have been better? Reference historical parallels if possible. (In Simplified Chinese)" }
        },
        required: ["turn", "summary", "commentary"]
      }
    }
  },
  required: ["real_event_title", "comparison_text", "radar_stats", "persona_title", "turn_reviews"]
};
var generateScenario = async (playStyle = "Balanced", playedEvents = []) => {
  const ai = getAI();
  const avoidList = playedEvents.length > 0 ? `
    AVOID THESE PREVIOUSLY PLAYED EVENTS (pick something different!):
    ${playedEvents.map((e) => `- ${e}`).join("\n    ")}
` : "";
  const prompt = `
    Generate a deep historical simulation scenario based on a REAL historical event (Ancient, Medieval, Industrial, or Modern).

    PLAYER SELECTED ARCHETYPE: "${playStyle}".

    ARCHETYPE GUIDES (Adjust the scenario to fit this theme):
    - "Conquest" (Military Focus): A war room scenario. High conflict.
    - "Prosperity" (Economic/Trade Focus): A trade hub, financial crisis, or merchant republic scenario.
    - "Reform" (Political/Cultural Focus): A time of revolution, religious schism, or modernization.
    - "Survival" (Crisis Focus): A nation on the brink of collapse (famine, civil war, invasion).

    CONTENT RESTRICTIONS (CRITICAL - MUST FOLLOW):
    - \u7981\u6B62\u751F\u62101949\u5E74\u540E\u4E2D\u56FD\u5927\u9646\u7684\u4EFB\u4F55\u653F\u6CBB\u4E8B\u4EF6\u3001\u653F\u6CBB\u8FD0\u52A8\u3001\u653F\u6CBB\u4EBA\u7269
    - \u7981\u6B62\u6D89\u53CA\u4EFB\u4F55\u56FD\u5BB6/\u5730\u533A\u7684\u9886\u571F\u4E3B\u6743\u4E89\u8BAE\uFF08\u53F0\u6E7E\u3001\u897F\u85CF\u3001\u65B0\u7586\u3001\u9999\u6E2F\u3001\u5357\u6D77\u3001\u9493\u9C7C\u5C9B\u7B49\uFF09
    - \u7981\u6B62\u6D89\u53CA\u4E2D\u56FD\u73B0\u4EFB\u53CA\u8FD1\u4EE3\u9886\u5BFC\u4EBA\uFF081949\u5E74\u540E\uFF09
    - \u5982\u9700\u751F\u6210\u4E2D\u56FD\u76F8\u5173\u573A\u666F\uFF0C\u4EC5\u9650\u4E8E1949\u5E74\u4EE5\u524D\u7684\u53E4\u4EE3/\u8FD1\u4EE3\u53F2\uFF08\u5982\u6625\u79CB\u6218\u56FD\u3001\u4E09\u56FD\u3001\u5510\u5B8B\u660E\u6E05\u3001\u592A\u5E73\u5929\u56FD\u3001\u8F9B\u4EA5\u9769\u547D\u7B49\uFF09
    - \u7981\u6B62\u4EFB\u4F55\u53EF\u80FD\u5F71\u5C04\u5F53\u4EE3\u4E2D\u56FD\u653F\u6CBB\u7684\u573A\u666F

    CRITICAL INSTRUCTIONS:
    1. **IDENTITY**: You MUST explicitly define the player's role. Are they an Emperor? A Prime Minister? A Revolutionary Leader? A Merchant Prince?
    2. **DIVERSITY**: Do not limit to ancient history. Use the Industrial Revolution, the Cold War, the Renaissance, or obscure historical crises. Prefer lesser-known events over popular ones like the Taiping Rebellion or Meiji Restoration.
    3. **ANONYMIZATION & NAMING CONSISTENCY**:
       - All names (people, places, factions) must be FULLY fictional. No direct hints at the real historical prototype.
       - All names within ONE scenario must follow a SINGLE cultural style. If the setting is East Asian, ALL names must be East Asian. If Western, ALL Western. NEVER mix "\u5F20\u4F2F\u4F26" with "\u51EF\u6492" in the same scenario.
       - Nation names should be abstract and evocative (e.g., "\u5927\u695A\u5E1D\u56FD", "\u78A7\u6D77\u5171\u548C\u56FD", "\u94C1\u51A0\u8054\u90A6"), not direct translations of real countries.
    4. **FACTIONS**: Can be countries, but also corporations, religious sects, or political parties. Factions must belong to the SAME era and cultural context as the scenario. A 17th-century kingdom must NOT face 20th-century powers.
    5. **ERA CONSISTENCY**: All technologies, weapons, concepts, institutions, and terminology must be appropriate to the scenario's historical era. No "information warfare" in ancient times, no "muskets" in the Bronze Age, no "international media" before mass communication existed.
    ${avoidList}
    Output LANGUAGE: Simplified Chinese (\u7B80\u4F53\u4E2D\u6587).
  `;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: scenarioSchema
      }
    });
    const data = JSON.parse(response.text || "{}");
    const sensitiveWord = checkObjectForSensitiveContent(data);
    if (sensitiveWord) {
      console.warn(`[ContentFilter] \u68C0\u6D4B\u5230\u654F\u611F\u8BCD "${sensitiveWord}"\uFF0C\u6B63\u5728\u91CD\u8BD5 (${attempt + 1}/${MAX_RETRIES})`);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("\u751F\u6210\u5185\u5BB9\u5305\u542B\u4E0D\u9002\u5B9C\u7684\u5185\u5BB9\uFF0C\u8BF7\u91CD\u8BD5");
      }
      continue;
    }
    return data;
  }
  throw new Error("\u751F\u6210\u573A\u666F\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
};
var evaluateTurn = async (scenario, historyLog, userAction, currentStats, turnCount = 1) => {
  const ai = getAI();
  const prompt = `
    You are a sophisticated historical deduction engine.
    Output LANGUAGE: Simplified Chinese (\u7B80\u4F53\u4E2D\u6587).

    CONTENT RESTRICTIONS (CRITICAL - MUST FOLLOW):
    - \u7981\u6B62\u751F\u62101949\u5E74\u540E\u4E2D\u56FD\u5927\u9646\u7684\u4EFB\u4F55\u653F\u6CBB\u4E8B\u4EF6\u3001\u653F\u6CBB\u8FD0\u52A8\u3001\u653F\u6CBB\u4EBA\u7269
    - \u7981\u6B62\u6D89\u53CA\u4EFB\u4F55\u56FD\u5BB6/\u5730\u533A\u7684\u9886\u571F\u4E3B\u6743\u4E89\u8BAE
    - \u7981\u6B62\u6D89\u53CA\u4E2D\u56FD\u73B0\u4EFB\u53CA\u8FD1\u4EE3\u9886\u5BFC\u4EBA\uFF081949\u5E74\u540E\uFF09
    - \u7981\u6B62\u4EFB\u4F55\u53EF\u80FD\u5F71\u5C04\u5F53\u4EE3\u4E2D\u56FD\u653F\u6CBB\u7684\u5185\u5BB9

    ADVISOR BIAS SYSTEM (CRITICAL):
    Advisors are NOT neutral. Each has personal agendas and blind spots:
    - **General (\u5C06\u519B)**: Always biased towards military solutions. May exaggerate threats to justify war. Ignores economic costs.
    - **Diplomat (\u5916\u4EA4\u5B98)**: Prefers negotiation even when inappropriate. May be naive about enemy intentions.
    - **Intel (\u5BC6\u63A2)**: Paranoid, sees conspiracies everywhere. May recommend excessive surveillance or purges.
    - **Scholar (\u5B66\u8005)**: Conservative, resistant to change. May oppose necessary reforms citing "tradition".
    - **Merchant (\u5546\u4EBA)**: Only cares about profit. May recommend policies that enrich traders but harm the nation.

    Some advisor suggestions should be TRAPS - sound reasonable but lead to bad outcomes. Players who blindly follow advice should sometimes fail.

    FEASIBILITY CHECK (CRITICAL - NO WISH FULFILLMENT):
    Before granting ANY player request, check if it's realistic given current stats:
    - **Military < 30**: Cannot wage offensive wars, conquer territories, or intimidate strong enemies
    - **Military < 50**: Cannot fight on multiple fronts or defeat major powers
    - **Economy < 30**: Cannot fund large projects, armies, or buy alliances
    - **Economy < 50**: Cannot sustain prolonged wars or massive construction
    - **Stability < 30**: Any major action risks rebellion or coup
    - **Stability < 50**: Ambitious reforms may backfire
    - **International Standing < 30**: Diplomatic initiatives will be ignored or mocked

    If player attempts something beyond their means:
    - The action should PARTIALLY FAIL or have severe unintended consequences
    - Narrative should explain WHY it failed (lack of resources, troops, legitimacy, etc.)
    - Do NOT let players "wish" their way to victory with eloquent commands

    DIFFICULTY SCALING BY PLAY STYLE:
    The scenario's original play style affects difficulty:
    - **Survival (\u751F\u5B58)**: Harshest mode. Stat deltas skew negative (-8 to +5). Frequent disasters. Advisors give more bad advice.
    - **Conquest (\u5F81\u670D)**: Military actions have higher variance. Big wins possible but also catastrophic defeats.
    - **Reform (\u6539\u9769)**: Reforms take multiple turns to show effect. Resistance from conservatives.
    - **Prosperity (\u7E41\u8363)**: Economic gains are slow and steady. Sudden windfalls are rare.

    Context:
    Real Event (Hidden): ${scenario.hidden_real_event}
    Play Style: ${scenario.play_style || "Balanced"}
    Player Identity: ${scenario.player_context.leader_title} of ${scenario.player_context.nation_name}
    Scenario: ${scenario.description}
    Current Stats: stability=${currentStats.stability}, economy=${currentStats.economy}, military=${currentStats.military}, international_standing=${currentStats.international_standing}
    External Factions: ${JSON.stringify(scenario.factions)}
    History: ${historyLog.join("\n")}
    User Action: "${userAction}"
    Current Turn: ${turnCount}
    Minimum Turns Before End: 8

    GAME DURATION RULES (CRITICAL):
    - The game has a MINIMUM of 8 turns. Before turn 8, you MUST set is_game_over to false.
    - After turn 8, only set is_game_over to true in EXTREME scenarios:
      * A stat has reached 0 (total collapse)
      * The nation has been completely destroyed/conquered
      * The leader has been overthrown/assassinated with no recovery
    - Do NOT end the game just because things are going badly. Crises create drama!
    - Keep generating NEW and DIVERSE crises. Avoid repeating similar scenarios.

    STATS-DRIVEN NARRATIVE (VERY IMPORTANT):
    The current stats MUST directly influence the narrative and world reactions:
    - **High stat (>=70)**: This is a national STRENGTH. Enemies should respect/fear it. Example: military=85 means rival nations are cautious about war; economy=90 means trade partners seek your favor.
    - **Low stat (<=30)**: This is a national WEAKNESS. It creates organic crises. Example: economy=15 means famine and unrest are natural; stability=20 means coups are plausible.
    - **Mid stat (31-69)**: Contested ground. Could go either way based on player actions.
    - If the player takes actions to improve a low stat, show GRADUAL improvement. Do NOT ignore their efforts. An economic reform should move economy upward, even if slowly.
    - The narrative, situation_update, headline, and rumor should all be CONSISTENT with current stats. Do NOT describe a prosperous nation when economy=15. Do NOT have weak nations threatening you when your military=90.

    STAT DELTA RULES:
    - Each stat delta must be between -10 and +10 per turn. NEVER exceed this range.
    - For turns 1-4 (early game): deltas must be between -5 and +8. Be GENTLE. The player is just getting started.
    - NO stat should drop to 0 in the first 8 turns. If a stat is already low (below 20), give it a small positive or zero delta instead.
    - The game should feel challenging but survivable. Gradual pressure, not instant death.
    - Stat changes must be LOGICALLY JUSTIFIED by the narrative. Do not randomly punish or reward stats unrelated to the current events.

    ERA & WORLD CONSISTENCY (CRITICAL):
    - All technologies, weapons, concepts, and institutions MUST match the scenario's historical era. No "information warfare" in ancient times, no "international media" before mass communication, no "muskets" in the Bronze Age.
    - Factions and enemies must belong to the SAME era. A 17th-century kingdom cannot face 20th-century powers.
    - All names (people, places) must follow a SINGLE cultural style consistent with the scenario. Never mix Eastern and Western names in the same world.
    - If the player uses anachronistic language, translate the INTENT into era-appropriate actions (e.g., "economic sanctions" \u2192 "trade embargo / blockade" in ancient settings).

    NARRATIVE COHERENCE:
    - All events within a SINGLE turn must be logically consistent with each other. Do NOT describe "capital fleeing the country" and "opening granaries to feed the poor" in the same turn unless there is an explicit causal link.
    - The narrative and situation_update must flow naturally from the previous turn's events and the player's action.
    - Earlier decisions must have delayed consequences. Reference previous turns when relevant.

    OBJECTIVE EVALUATION (CRITICAL):
    - Judge the player's action by its LOGICAL FEASIBILITY and STRATEGIC MERIT, not by how passionately or eloquently it is written.
    - A fiery speech with exclamation marks does NOT automatically succeed. Ask: Is this action realistic? Does the player have the resources/authority to do this? Would this work in this historical context?
    - Unrealistic or vague actions should have mixed or negative results. Specific, clever strategies should be rewarded.
    - The player can fail. Not every action leads to a good outcome.

    CORE RULES:
    1. **Allow Creativity**: The player might use Economic, Cultural, Diplomatic, or Espionage tactics. Do NOT force a military outcome if they used a non-military strategy.
    2. **Logical Consequences**: Apply the player's intent through era-appropriate means. If it's strategically sound AND feasible given current stats, reward it proportionally. If not feasible, it should fail or backfire.
    3. **The Hook**: The 'situation_update' must be a NEW problem. It doesn't have to be a battle. It could be:
       - A market crash.
       - A popular uprising.
       - A technological breakthrough by a rival.
       - A scandalous rumor about the leader.
       - A religious schism or cultural clash.
       - A natural disaster or plague.
       - An internal power struggle.
       - A diplomatic betrayal.
    4. **Escalation**: As turns progress, crises should evolve and interconnect.
    5. **No Wish Fulfillment**: The player is NOT always successful. Vague commands, overambitious plans, and actions without proper resources should fail or have mixed results.

    FACTION UPDATE RULES (CRITICAL):
    You MUST return an updated factions_update array every turn:
    - If a faction is destroyed by player action, mark is_destroyed: true and attitude: "\u5DF2\u706D\u4EA1"
    - If a new threat emerges, add a NEW faction with is_new: true
    - Update attitudes based on player actions (war \u2192 "\u654C\u5BF9", diplomacy \u2192 "\u53CB\u597D", etc.)
    - NEW FACTIONS MUST belong to the SAME era and geographic region as the original scenario. If the scenario is ancient Greece, new factions must be Mediterranean powers of that era (Persia, Egypt, Carthage), NOT modern nations.
    - Keep the total number of active factions between 2-4

    Task:
    1. Describe the outcome of the action (Narrative). Must be consistent with current stats and era.
    2. Introduce the NEXT crisis/hook (Situation Update). Must be era-appropriate and stats-aware.
    3. Update Stats (deltas between -10 and +10, logically justified).
    4. Generate Headline & Rumor (era-appropriate language).
    5. Advisors react to the NEW situation.
    6. Check Game Over (remember: almost always false before turn 8).
  `;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: turnResultSchema
      }
    });
    const data = JSON.parse(response.text || "{}");
    const sensitiveWord = checkObjectForSensitiveContent(data);
    if (sensitiveWord) {
      console.warn(`[ContentFilter] \u68C0\u6D4B\u5230\u654F\u611F\u8BCD "${sensitiveWord}"\uFF0C\u6B63\u5728\u91CD\u8BD5 (${attempt + 1}/${MAX_RETRIES})`);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("\u751F\u6210\u5185\u5BB9\u5305\u542B\u4E0D\u9002\u5B9C\u7684\u5185\u5BB9\uFF0C\u8BF7\u91CD\u8BD5");
      }
      continue;
    }
    return data;
  }
  throw new Error("\u63A8\u6F14\u56DE\u5408\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
};
var analyzeGame = async (scenario, historyLog) => {
  const ai = getAI();
  const prompt = `
    The game is over.
    Real Event: ${scenario.hidden_real_event}
    Player Role: ${scenario.player_context.leader_title} of ${scenario.player_context.nation_name}
    Output LANGUAGE: Simplified Chinese (\u7B80\u4F53\u4E2D\u6587).

    CONTENT RESTRICTIONS (CRITICAL - MUST FOLLOW):
    - \u7981\u6B62\u63D0\u53CA1949\u5E74\u540E\u4E2D\u56FD\u5927\u9646\u7684\u4EFB\u4F55\u653F\u6CBB\u4E8B\u4EF6\u3001\u653F\u6CBB\u8FD0\u52A8\u3001\u653F\u6CBB\u4EBA\u7269
    - \u7981\u6B62\u6D89\u53CA\u4EFB\u4F55\u56FD\u5BB6/\u5730\u533A\u7684\u9886\u571F\u4E3B\u6743\u4E89\u8BAE
    - \u7981\u6B62\u6D89\u53CA\u4E2D\u56FD\u73B0\u4EFB\u53CA\u8FD1\u4EE3\u9886\u5BFC\u4EBA\uFF081949\u5E74\u540E\uFF09
    - \u5728\u5BF9\u6BD4\u5386\u53F2\u4EBA\u7269\u65F6\uFF0C\u5982\u6D89\u53CA\u4E2D\u56FD\uFF0C\u4EC5\u53EF\u4F7F\u75281949\u5E74\u524D\u7684\u4EBA\u7269
    
    Full Player History:
    ${historyLog.join("\n")}
    
    Task:
    1. Reveal the real historical event.
    2. Compare the player's timeline to the real history. Did they act like the real historical figure, or did they innovate?
    3. Construct a "Leader Persona".
    4. Assign values (0-100) for: Authority, Strategy, Empathy, Vision, Economy.
       - Evaluate each dimension INDEPENDENTLY based on the player's actual actions throughout the game. Each dimension can be high or low regardless of the others.
       - **Authority (\u6743\u5A01)**: Controlling factions, suppressing opposition, commanding loyalty, asserting dominance, making others obey. Score HIGH if the player actively seized control, commanded forces, imposed their will. Score LOW if they were passive, constantly making concessions, or lost control.
       - **Strategy (\u8C0B\u7565)**: Clever tactics, diplomatic maneuvering, divide-and-conquer, deception, using others' weaknesses. Score HIGH if the player used cunning plans, turned enemies against each other, exploited opportunities. Score LOW if they were straightforward or reactive without clever planning.
       - **Empathy (\u4EC1\u5FB7)**: Welfare policies, protecting civilians, diplomatic mediation, cultural investment, seeking peaceful solutions. Score HIGH only if the player actually prioritized people's welfare. Score LOW if they were ruthless or indifferent to civilian suffering.
       - **Vision (\u8FDC\u89C1)**: Long-term planning, institution building, reforms, infrastructure, investing in the future rather than just reacting to crises. Score HIGH if the player built lasting systems or pursued forward-looking policies. Score LOW if they only dealt with immediate threats.
       - **Economy (\u7ECF\u6D4E)**: Trade development, fiscal management, resource allocation, economic reforms, wealth creation. Score HIGH if the player actively built economic strength. Score LOW if they neglected or damaged the economy.
       - Use the FULL 0-100 range. Do not cluster all scores around 40-60. A dominant trait should be 70+, a weak one should be below 30.
    5. Pick a historical figure they resemble (Can be from any era/region).
    6. For EACH turn in the player's history, write a brief strategic review (turn_reviews):
       - "summary": one sentence summarizing the player's action
       - "commentary": 2-3 sentences of strategic critique. Was it a good move? What were the consequences? What would a better alternative have been? Reference real historical strategies or figures when relevant.
       Be honest and insightful, like a military academy professor debriefing a war game.
  `;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });
    const data = JSON.parse(response.text || "{}");
    const sensitiveWord = checkObjectForSensitiveContent(data);
    if (sensitiveWord) {
      console.warn(`[ContentFilter] \u68C0\u6D4B\u5230\u654F\u611F\u8BCD "${sensitiveWord}"\uFF0C\u6B63\u5728\u91CD\u8BD5 (${attempt + 1}/${MAX_RETRIES})`);
      if (attempt === MAX_RETRIES - 1) {
        throw new Error("\u751F\u6210\u5185\u5BB9\u5305\u542B\u4E0D\u9002\u5B9C\u7684\u5185\u5BB9\uFF0C\u8BF7\u91CD\u8BD5");
      }
      continue;
    }
    return data;
  }
  throw new Error("\u5206\u6790\u6E38\u620F\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5");
};

// virtual:constants.ts
var INITIAL_STATS = {
  stability: 70,
  economy: 60,
  military: 50,
  international_standing: 50
};
var MIN_TURNS_BEFORE_END = 8;
var HARD_CAP_TURNS = 28;
var VICTORY_AVG = 65;
var DEFEAT_AVG = 40;
var PERFECT_VICTORY_AVG = 100;

// virtual:components/GameInterface.tsx
import { useState, useRef, useEffect } from "react";
import { Send, Terminal, Users, Globe2, AlertTriangle, ArrowRight, UserCircle2, BookOpen as BookOpen2, Save, Flag } from "lucide-react";

// virtual:components/AdvisorCard.tsx
import { Shield, Scroll, Eye, BookOpen, Coins } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
var AdvisorCard = ({ advisor }) => {
  const roleMap = {
    "General": "\u5C06\u519B",
    "Diplomat": "\u5916\u4EA4\u5B98",
    "Intel": "\u60C5\u62A5\u603B\u7BA1",
    "Scholar": "\u5B66\u8005",
    "Merchant": "\u8D22\u653F\u5927\u81E3"
  };
  const getIcon = () => {
    switch (advisor.role) {
      case "General":
        return /* @__PURE__ */ jsx(Shield, { size: 16 });
      case "Diplomat":
        return /* @__PURE__ */ jsx(Scroll, { size: 16 });
      case "Intel":
        return /* @__PURE__ */ jsx(Eye, { size: 16 });
      case "Scholar":
        return /* @__PURE__ */ jsx(BookOpen, { size: 16 });
      case "Merchant":
        return /* @__PURE__ */ jsx(Coins, { size: 16 });
      default:
        return /* @__PURE__ */ jsx(Shield, { size: 16 });
    }
  };
  const getBorderColor = () => {
    switch (advisor.role) {
      case "General":
        return "border-red-900/30 text-red-100/80";
      case "Diplomat":
        return "border-blue-900/30 text-blue-100/80";
      case "Intel":
        return "border-emerald-900/30 text-emerald-100/80";
      case "Scholar":
        return "border-purple-900/30 text-purple-100/80";
      case "Merchant":
        return "border-amber-900/30 text-amber-100/80";
      default:
        return "border-zinc-800";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-md border bg-zinc-900/50 ${getBorderColor()} flex flex-col gap-2 transition-all hover:bg-zinc-900`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-mono text-xs uppercase tracking-widest opacity-70", children: [
      getIcon(),
      /* @__PURE__ */ jsxs("span", { children: [
        roleMap[advisor.role] || advisor.role,
        " // ",
        advisor.name
      ] })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-sm font-serif italic leading-relaxed", children: [
      '"',
      advisor.advice,
      '"'
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "text-[10px] uppercase tracking-wider font-mono opacity-50 text-right", children: [
      "\u503E\u5411: ",
      advisor.bias
    ] })
  ] });
};
var AdvisorCard_default = AdvisorCard;

// virtual:components/FactionCard.tsx
import { Map, AlertCircle, TrendingUp, Target } from "lucide-react";
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var FactionCard = ({ faction }) => {
  return /* @__PURE__ */ jsxs2("div", { className: "p-4 rounded-md border border-zinc-800 bg-zinc-900/50 flex flex-col gap-3 transition-all hover:bg-zinc-900", children: [
    /* @__PURE__ */ jsxs2("div", { className: "flex items-center justify-between border-b border-zinc-800 pb-2", children: [
      /* @__PURE__ */ jsxs2("div", { className: "flex items-center gap-2 font-mono font-bold text-zinc-200", children: [
        /* @__PURE__ */ jsx2(Map, { size: 16, className: "text-zinc-500" }),
        /* @__PURE__ */ jsx2("span", { children: faction.name })
      ] }),
      /* @__PURE__ */ jsx2("span", { className: "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-800 text-zinc-400", children: faction.attitude })
    ] }),
    /* @__PURE__ */ jsx2("p", { className: "text-sm font-serif text-zinc-400 italic leading-snug", children: faction.description }),
    /* @__PURE__ */ jsxs2("div", { className: "grid grid-cols-1 gap-2 mt-1", children: [
      /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-2 text-xs", children: [
        /* @__PURE__ */ jsx2(TrendingUp, { size: 14, className: "text-emerald-500 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("span", { className: "font-mono text-zinc-500 uppercase mr-2", children: "\u4F18\u52BF:" }),
          /* @__PURE__ */ jsx2("span", { className: "text-zinc-300", children: faction.strength })
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-2 text-xs", children: [
        /* @__PURE__ */ jsx2(AlertCircle, { size: 14, className: "text-red-500 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("span", { className: "font-mono text-zinc-500 uppercase mr-2", children: "\u5F31\u70B9:" }),
          /* @__PURE__ */ jsx2("span", { className: "text-red-200/80", children: faction.weakness })
        ] })
      ] }),
      /* @__PURE__ */ jsxs2("div", { className: "flex items-start gap-2 text-xs", children: [
        /* @__PURE__ */ jsx2(Target, { size: 14, className: "text-amber-500 mt-0.5 shrink-0" }),
        /* @__PURE__ */ jsxs2("div", { children: [
          /* @__PURE__ */ jsx2("span", { className: "font-mono text-zinc-500 uppercase mr-2", children: "\u6025\u9700:" }),
          /* @__PURE__ */ jsx2("span", { className: "text-amber-200/80", children: faction.needs })
        ] })
      ] })
    ] })
  ] });
};
var FactionCard_default = FactionCard;

// virtual:components/StatBar.tsx
import { jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var StatBar = ({ label, value }) => {
  let colorClass = "bg-zinc-600";
  if (value < 30) colorClass = "bg-red-600";
  else if (value > 70) colorClass = "bg-emerald-600";
  else colorClass = "bg-amber-600";
  return /* @__PURE__ */ jsxs3("div", { className: "flex flex-col gap-1 w-full min-w-0", children: [
    /* @__PURE__ */ jsxs3("div", { className: "flex justify-between text-[9px] md:text-xs font-mono text-zinc-400 uppercase tracking-tighter md:tracking-wider whitespace-nowrap overflow-hidden", children: [
      /* @__PURE__ */ jsx3("span", { className: "truncate mr-1", children: label }),
      /* @__PURE__ */ jsxs3("span", { className: "shrink-0", children: [
        value,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsx3("div", { className: "h-1 md:h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx3(
      "div",
      {
        className: `h-full ${colorClass} transition-all duration-700 ease-out`,
        style: { width: `${Math.max(0, Math.min(100, value))}%` }
      }
    ) })
  ] });
};
var StatBar_default = StatBar;

// virtual:components/GameInterface.tsx
import { Fragment, jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var GameInterface = ({ gameState, onAction, isProcessing, onOpenSaveManager, onEndGame }) => {
  const [input, setInput] = useState("");
  const [activeMainTab, setActiveMainTab] = useState("chronicle");
  const scrollRef = useRef(null);
  const result = gameState.currentTurnResult;
  const scenario = gameState.scenario;
  useEffect(() => {
    if (scrollRef.current && activeMainTab === "chronicle") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.historyLog, result, activeMainTab]);
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    onAction(input);
    setInput("");
  };
  if (!scenario) return null;
  return /* @__PURE__ */ jsxs4("div", { className: "flex flex-col h-[100dvh] w-full max-w-7xl mx-auto p-2 md:p-6 gap-3 md:gap-6 bg-zinc-950 overflow-hidden", children: [
    /* @__PURE__ */ jsxs4("header", { className: "flex flex-col md:flex-row gap-2 md:gap-4 shrink-0", children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex bg-zinc-900 border border-zinc-800 rounded-lg p-3 items-center gap-3 md:min-w-[280px]", children: [
        /* @__PURE__ */ jsx4("div", { className: "p-2 bg-zinc-950 rounded-full border border-zinc-800 shrink-0", children: /* @__PURE__ */ jsx4(UserCircle2, { size: 20, className: "text-zinc-300 md:w-6 md:h-6" }) }),
        /* @__PURE__ */ jsxs4("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx4("div", { className: "text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1", children: "CURRENT IDENTITY" }),
          /* @__PURE__ */ jsx4("h2", { className: "text-sm md:text-lg font-bold font-serif text-white leading-tight truncate", children: scenario.player_context.nation_name }),
          /* @__PURE__ */ jsx4("p", { className: "text-[10px] md:text-sm text-emerald-500 font-mono leading-none", children: scenario.player_context.leader_title })
        ] })
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg backdrop-blur-sm", children: [
        /* @__PURE__ */ jsx4(StatBar_default, { label: "\u793E\u4F1A\u7A33\u5B9A", value: gameState.stats.stability }),
        /* @__PURE__ */ jsx4(StatBar_default, { label: "\u7ECF\u6D4E\u72B6\u51B5", value: gameState.stats.economy }),
        /* @__PURE__ */ jsx4(StatBar_default, { label: "\u519B\u4E8B\u529B\u91CF", value: gameState.stats.military }),
        /* @__PURE__ */ jsx4(StatBar_default, { label: "\u56FD\u9645\u58F0\u671B", value: gameState.stats.international_standing })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "flex-1 flex flex-col md:flex-row gap-6 overflow-hidden relative", children: [
      /* @__PURE__ */ jsxs4("div", { className: "flex md:hidden border-b border-zinc-800 shrink-0 bg-zinc-950", children: [
        /* @__PURE__ */ jsxs4(
          "button",
          {
            onClick: () => setActiveMainTab("chronicle"),
            className: `flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-mono uppercase tracking-widest ${activeMainTab === "chronicle" ? "text-emerald-500 border-b-2 border-emerald-500" : "text-zinc-500"}`,
            children: [
              /* @__PURE__ */ jsx4(BookOpen2, { size: 18, className: "mb-1" }),
              /* @__PURE__ */ jsx4("span", { children: "\u7F16\u5E74\u53F2" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs4(
          "button",
          {
            onClick: () => setActiveMainTab("consult"),
            className: `flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-mono uppercase tracking-widest ${activeMainTab === "consult" ? "text-amber-500 border-b-2 border-amber-500" : "text-zinc-500"}`,
            children: [
              /* @__PURE__ */ jsx4(Users, { size: 18, className: "mb-1" }),
              /* @__PURE__ */ jsx4("span", { children: "\u5185\u9601" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs4(
          "button",
          {
            onClick: () => setActiveMainTab("intel"),
            className: `flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-mono uppercase tracking-widest ${activeMainTab === "intel" ? "text-blue-500 border-b-2 border-blue-500" : "text-zinc-500"}`,
            children: [
              /* @__PURE__ */ jsx4(Globe2, { size: 18, className: "mb-1" }),
              /* @__PURE__ */ jsx4("span", { children: "\u60C5\u62A5" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs4("div", { className: `flex-1 flex flex-col bg-zinc-950 md:bg-zinc-950 border md:border-zinc-800 rounded-lg relative overflow-hidden shadow-2xl ${activeMainTab === "chronicle" ? "flex" : "hidden md:flex"}`, children: [
        /* @__PURE__ */ jsxs4("div", { className: "hidden md:flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800", children: [
          /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-2 text-zinc-500 font-mono text-xs", children: [
            /* @__PURE__ */ jsx4(Terminal, { size: 14 }),
            /* @__PURE__ */ jsx4("span", { children: "CMD_ACCESS_LEVEL_ALPHA" })
          ] }),
          /* @__PURE__ */ jsx4("div", { className: "text-emerald-500 font-mono text-xs animate-pulse", children: isProcessing ? "\u6B63\u5728\u63A8\u6F14\u5C40\u52BF..." : "\u7B49\u5F85\u6307\u4EE4" })
        ] }),
        /* @__PURE__ */ jsxs4("div", { ref: scrollRef, className: "flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 pb-24 md:pb-6", children: [
          gameState.turnCount === 1 && !result && /* @__PURE__ */ jsxs4("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-700", children: [
            /* @__PURE__ */ jsxs4("span", { className: "inline-block px-2 py-0.5 bg-zinc-800 text-zinc-300 font-mono text-[10px] uppercase tracking-widest mb-2", children: [
              scenario.start_date,
              " // \u521D\u59CB\u7B80\u62A5"
            ] }),
            /* @__PURE__ */ jsxs4("div", { className: "mb-6 pb-6 border-b border-zinc-800/50", children: [
              /* @__PURE__ */ jsxs4("p", { className: "text-zinc-400 font-serif italic mb-2 text-sm", children: [
                "\u5173\u4E8E ",
                scenario.player_context.nation_name,
                ":"
              ] }),
              /* @__PURE__ */ jsx4("p", { className: "text-xs text-zinc-500 leading-relaxed font-mono", children: scenario.player_context.background_summary })
            ] }),
            /* @__PURE__ */ jsx4("p", { className: "text-base md:text-xl font-serif text-zinc-100 leading-relaxed", children: scenario.description }),
            /* @__PURE__ */ jsxs4("div", { className: "mt-6 p-4 bg-zinc-900/40 border-l-2 border-emerald-500 rounded-r", children: [
              /* @__PURE__ */ jsxs4("h3", { className: "text-emerald-500 font-mono text-xs uppercase tracking-wider mb-2 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx4(AlertTriangle, { size: 14 }),
                " \u5F53\u524D\u5371\u673A"
              ] }),
              /* @__PURE__ */ jsxs4("p", { className: "text-zinc-300 font-serif italic text-sm", children: [
                "\u9601\u4E0B\uFF0C\u4F5C\u4E3A",
                scenario.player_context.leader_title,
                "\uFF0C\u60A8\u7684\u7B2C\u4E00\u9053\u653F\u4EE4\u662F\u4EC0\u4E48\uFF1F"
              ] })
            ] })
          ] }),
          result && /* @__PURE__ */ jsxs4("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6 md:space-y-8", children: [
            /* @__PURE__ */ jsxs4("div", { className: "flex flex-col md:flex-row gap-2 border-b border-zinc-800 pb-4", children: [
              /* @__PURE__ */ jsxs4("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx4("span", { className: "text-zinc-500 font-mono text-[10px] uppercase block mb-1", children: result.date_display }),
                /* @__PURE__ */ jsxs4("h3", { className: "text-lg md:text-xl font-serif font-bold text-zinc-200", children: [
                  '"',
                  result.headline,
                  '"'
                ] })
              ] }),
              /* @__PURE__ */ jsx4("div", { className: "md:text-right md:max-w-[40%] shrink-0", children: /* @__PURE__ */ jsxs4("p", { className: "text-zinc-500 italic text-xs", children: [
                '\u6C11\u95F4\u6D41\u8A00: "',
                result.rumor,
                '"'
              ] }) })
            ] }),
            /* @__PURE__ */ jsxs4("div", { className: "opacity-80", children: [
              /* @__PURE__ */ jsxs4("span", { className: "inline-flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase tracking-widest mb-2", children: [
                /* @__PURE__ */ jsx4(ArrowRight, { size: 12 }),
                " \u6267\u884C\u7ED3\u679C"
              ] }),
              /* @__PURE__ */ jsx4("p", { className: "text-sm md:text-base font-serif text-zinc-400 leading-relaxed", children: result.narrative })
            ] }),
            /* @__PURE__ */ jsxs4("div", { className: "p-4 md:p-5 bg-zinc-900/60 border border-zinc-700 rounded-md relative overflow-hidden", children: [
              /* @__PURE__ */ jsx4("div", { className: "absolute top-0 left-0 w-1 h-full bg-amber-600" }),
              /* @__PURE__ */ jsxs4("div", { className: "relative z-10", children: [
                /* @__PURE__ */ jsxs4("h3", { className: "text-amber-500 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] mb-3 flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx4(AlertTriangle, { size: 14 }),
                  " \u6700\u65B0\u60C5\u62A5 // \u9700\u7ACB\u5373\u51B3\u7B56"
                ] }),
                /* @__PURE__ */ jsx4("p", { className: "text-base md:text-xl font-serif text-zinc-100 leading-relaxed", children: result.situation_update })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx4("div", { className: `p-3 md:p-4 bg-zinc-900 border-t border-zinc-800 shrink-0 ${activeMainTab === "chronicle" ? "fixed bottom-0 left-0 w-full z-50 md:relative md:bottom-auto" : "hidden md:block"}`, children: /* @__PURE__ */ jsxs4("form", { onSubmit: handleSubmit, className: "relative max-w-7xl mx-auto", children: [
          /* @__PURE__ */ jsx4(
            "textarea",
            {
              value: input,
              onChange: (e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
              },
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              },
              placeholder: "\u4E0B\u8FBE\u6307\u4EE4... (\u5916\u4EA4\u3001\u7ECF\u6D4E\u3001\u519B\u4E8B\u7B49)",
              autoFocus: true,
              disabled: isProcessing,
              rows: 2,
              className: "w-full bg-zinc-950 text-zinc-100 border border-zinc-700 rounded p-3 md:p-4 pr-12 font-mono text-sm focus:outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700 resize-none overflow-y-auto"
            }
          ),
          /* @__PURE__ */ jsx4(
            "button",
            {
              type: "submit",
              disabled: !input.trim() || isProcessing,
              className: "absolute right-2 bottom-3 p-2 text-zinc-500 hover:text-emerald-500 disabled:opacity-30 transition-colors",
              children: /* @__PURE__ */ jsx4(Send, { size: 18 })
            }
          )
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs4("aside", { className: `w-full md:w-80 flex flex-col h-full bg-zinc-950 border-x md:border border-zinc-800 rounded-lg overflow-hidden ${activeMainTab === "chronicle" ? "hidden md:flex" : "flex"}`, children: [
        /* @__PURE__ */ jsxs4("div", { className: "hidden md:flex border-b border-zinc-800", children: [
          /* @__PURE__ */ jsxs4(
            "button",
            {
              onClick: () => setActiveMainTab("consult"),
              className: `flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors ${activeMainTab === "consult" || activeMainTab === "chronicle" ? "bg-zinc-900 text-zinc-100" : "bg-zinc-950 text-zinc-600"}`,
              children: [
                /* @__PURE__ */ jsx4(Users, { size: 14 }),
                /* @__PURE__ */ jsx4("span", { children: "\u5185\u9601\u5EFA\u8BAE" })
              ]
            }
          ),
          /* @__PURE__ */ jsx4("div", { className: "w-px bg-zinc-800 h-full" }),
          /* @__PURE__ */ jsxs4(
            "button",
            {
              onClick: () => setActiveMainTab("intel"),
              className: `flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors ${activeMainTab === "intel" ? "bg-zinc-900 text-zinc-100" : "bg-zinc-950 text-zinc-600"}`,
              children: [
                /* @__PURE__ */ jsx4(Globe2, { size: 14 }),
                /* @__PURE__ */ jsx4("span", { children: "\u5916\u90E8\u60C5\u62A5" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx4("div", { className: "flex-1 overflow-y-auto p-4 space-y-3", children: activeMainTab === "consult" || activeMainTab === "chronicle" && window.innerWidth >= 768 ? /* @__PURE__ */ jsxs4(Fragment, { children: [
          /* @__PURE__ */ jsx4("div", { className: "text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1 text-center", children: "TOP SECRET // ADVISORY" }),
          (result ? result.advisors : scenario.initial_advisors).map((advisor, idx) => /* @__PURE__ */ jsx4(AdvisorCard_default, { advisor }, idx))
        ] }) : activeMainTab === "intel" ? /* @__PURE__ */ jsxs4(Fragment, { children: [
          /* @__PURE__ */ jsx4("div", { className: "text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1 text-center", children: "GEOPOLITICAL INTELLIGENCE" }),
          scenario.factions.map((faction, idx) => /* @__PURE__ */ jsx4(FactionCard_default, { faction }, idx))
        ] }) : null }),
        /* @__PURE__ */ jsx4("div", { className: "p-4 bg-zinc-900/30 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono", children: /* @__PURE__ */ jsxs4("div", { className: "flex justify-between items-center gap-2", children: [
          /* @__PURE__ */ jsxs4("span", { children: [
            "TURN: ",
            gameState.turnCount
          ] }),
          /* @__PURE__ */ jsx4("span", { className: gameState.turnCount <= MIN_TURNS_BEFORE_END ? "text-zinc-600" : "text-emerald-700", children: gameState.turnCount <= MIN_TURNS_BEFORE_END ? "\u5E8F\u7AE0" : "ACTIVE" }),
          /* @__PURE__ */ jsxs4("div", { className: "flex items-center gap-3", children: [
            onOpenSaveManager && /* @__PURE__ */ jsxs4(
              "button",
              {
                onClick: onOpenSaveManager,
                className: "flex items-center gap-1 text-zinc-600 hover:text-zinc-400 transition-colors",
                children: [
                  /* @__PURE__ */ jsx4(Save, { size: 12 }),
                  " \u5B58\u6863"
                ]
              }
            ),
            onEndGame && gameState.turnCount > MIN_TURNS_BEFORE_END && /* @__PURE__ */ jsxs4(
              "button",
              {
                onClick: onEndGame,
                disabled: isProcessing,
                className: "flex items-center gap-1 text-amber-600 hover:text-amber-400 transition-colors disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsx4(Flag, { size: 12 }),
                  " \u7ED3\u675F\u63A8\u6F14"
                ]
              }
            )
          ] })
        ] }) })
      ] })
    ] })
  ] });
};
var GameInterface_default = GameInterface;

// virtual:components/LoadingScreen.tsx
import { Loader2 } from "lucide-react";
import { jsx as jsx5, jsxs as jsxs5 } from "react/jsx-runtime";
var LoadingScreen = ({ message }) => {
  return /* @__PURE__ */ jsxs5("div", { className: "flex flex-col items-center justify-center h-full w-full min-h-[400px] text-zinc-400", children: [
    /* @__PURE__ */ jsx5(Loader2, { className: "w-12 h-12 animate-spin mb-4 text-emerald-500" }),
    /* @__PURE__ */ jsx5("p", { className: "font-mono text-sm animate-pulse tracking-widest uppercase", children: message })
  ] });
};
var LoadingScreen_default = LoadingScreen;

// virtual:components/EndGameReport.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { RefreshCcw, Scroll as Scroll2 } from "lucide-react";
import { jsx as jsx6, jsxs as jsxs6 } from "react/jsx-runtime";
var traitMap = {
  "Authority": "\u6743\u5A01",
  "Strategy": "\u8C0B\u7565",
  "Empathy": "\u4EC1\u5FB7",
  "Vision": "\u8FDC\u89C1",
  "Economy": "\u7ECF\u6D4E",
  "Iron Fist": "\u94C1\u8840",
  // Legacy support
  "Cunning": "\u72E1\u8BC8",
  // Legacy support
  "Benevolence": "\u4EC1\u6148"
  // Legacy support
};
var EndGameReport = ({ data, onRestart, onViewHistory }) => {
  return /* @__PURE__ */ jsxs6("div", { className: "w-full max-w-4xl mx-auto p-4 md:p-10 animate-in fade-in duration-1000 pb-20", children: [
    /* @__PURE__ */ jsxs6("div", { className: "text-center mb-8 md:mb-12", children: [
      /* @__PURE__ */ jsx6("h1", { className: "text-2xl md:text-5xl font-serif text-zinc-100 mb-2", children: "\u5386\u53F2\u5DF2\u5B9A\u683C" }),
      /* @__PURE__ */ jsx6("div", { className: "h-px w-16 md:w-24 bg-zinc-700 mx-auto my-4 md:my-6" }),
      /* @__PURE__ */ jsx6("p", { className: "text-zinc-400 font-mono text-[10px] md:text-sm uppercase tracking-widest", children: "\u771F\u76F8\u63ED\u79D8" })
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12", children: [
      /* @__PURE__ */ jsxs6("div", { className: "bg-zinc-900/50 border border-zinc-800 p-4 md:p-6 rounded-lg", children: [
        /* @__PURE__ */ jsx6("h2", { className: "text-amber-500 font-mono text-[10px] uppercase tracking-[0.2em] mb-3", children: "\u5386\u53F2\u539F\u578B" }),
        /* @__PURE__ */ jsx6("h3", { className: "text-xl md:text-2xl font-serif text-white mb-3", children: data.real_event_title }),
        /* @__PURE__ */ jsx6("p", { className: "text-zinc-400 text-xs md:text-sm leading-relaxed mb-6 font-serif border-l-2 border-zinc-700 pl-4", children: data.real_outcome_summary }),
        /* @__PURE__ */ jsx6("h2", { className: "text-emerald-500 font-mono text-[10px] uppercase tracking-[0.2em] mb-3 mt-6", children: "\u4F60\u7684\u65F6\u95F4\u7EBF" }),
        /* @__PURE__ */ jsx6("p", { className: "text-zinc-300 text-xs md:text-sm leading-relaxed font-serif", children: data.comparison_text })
      ] }),
      /* @__PURE__ */ jsxs6("div", { className: "bg-zinc-900/50 border border-zinc-800 p-4 md:p-6 rounded-lg flex flex-col items-center", children: [
        /* @__PURE__ */ jsx6("h2", { className: "text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em] mb-2", children: "\u7EDF\u6CBB\u8005\u753B\u50CF" }),
        /* @__PURE__ */ jsx6("h3", { className: "text-lg md:text-xl font-bold text-white mb-1 text-center", children: data.persona_title }),
        /* @__PURE__ */ jsxs6("p", { className: "text-zinc-400 text-[10px] md:text-xs text-center mb-4 md:mb-6", children: [
          "\u76F8\u4F3C\u4EBA\u7269: ",
          /* @__PURE__ */ jsx6("span", { className: "text-zinc-200", children: data.similar_historical_figure })
        ] }),
        /* @__PURE__ */ jsx6("div", { className: "w-full h-48 md:h-64 mb-4", children: /* @__PURE__ */ jsx6(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs6(RadarChart, { cx: "50%", cy: "50%", outerRadius: "80%", data: data.radar_stats, children: [
          /* @__PURE__ */ jsx6(PolarGrid, { stroke: "#3f3f46" }),
          /* @__PURE__ */ jsx6(
            PolarAngleAxis,
            {
              dataKey: "dimension",
              tickFormatter: (val) => traitMap[val] || val,
              tick: { fill: "#a1a1aa", fontSize: 10, fontFamily: "monospace" }
            }
          ),
          /* @__PURE__ */ jsx6(PolarRadiusAxis, { angle: 30, domain: [0, 100], tick: false, axisLine: false }),
          /* @__PURE__ */ jsx6(
            Radar,
            {
              name: "Persona",
              dataKey: "value",
              stroke: "#10b981",
              strokeWidth: 2,
              fill: "#10b981",
              fillOpacity: 0.3
            }
          )
        ] }) }) }),
        /* @__PURE__ */ jsx6("p", { className: "text-center text-[10px] md:text-xs text-zinc-500 font-mono italic max-w-xs leading-tight", children: data.persona_description })
      ] })
    ] }),
    data.turn_reviews && data.turn_reviews.length > 0 && /* @__PURE__ */ jsxs6("div", { className: "mb-8 md:mb-12", children: [
      /* @__PURE__ */ jsxs6("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsx6("h2", { className: "text-lg md:text-2xl font-serif text-zinc-100 mb-2", children: "\u51B3\u7B56\u590D\u76D8" }),
        /* @__PURE__ */ jsx6("p", { className: "text-zinc-500 font-mono text-[10px] uppercase tracking-widest", children: "\u9010\u56DE\u5408\u6218\u7565\u70B9\u8BC4" })
      ] }),
      /* @__PURE__ */ jsx6("div", { className: "space-y-3", children: data.turn_reviews.map((review, idx) => /* @__PURE__ */ jsx6("div", { className: "bg-zinc-900/50 border border-zinc-800 rounded-lg p-4", children: /* @__PURE__ */ jsxs6("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsx6("span", { className: "shrink-0 w-8 h-8 flex items-center justify-center bg-zinc-800 text-zinc-400 font-mono text-xs rounded-full", children: review.turn }),
        /* @__PURE__ */ jsxs6("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx6("p", { className: "text-zinc-200 text-sm font-serif mb-1", children: review.summary }),
          /* @__PURE__ */ jsx6("p", { className: "text-zinc-500 text-xs leading-relaxed font-serif italic", children: review.commentary })
        ] })
      ] }) }, idx)) })
    ] }),
    /* @__PURE__ */ jsxs6("div", { className: "text-center flex flex-col items-center gap-3", children: [
      /* @__PURE__ */ jsxs6(
        "button",
        {
          onClick: onRestart,
          className: "group relative inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-3 bg-zinc-100 text-zinc-950 font-mono text-xs md:text-sm uppercase tracking-widest hover:bg-white active:scale-95 transition-all",
          children: [
            /* @__PURE__ */ jsx6(RefreshCcw, { size: 14, className: "group-hover:-rotate-180 transition-transform duration-500" }),
            /* @__PURE__ */ jsx6("span", { children: "\u91CD\u5199\u5386\u53F2" })
          ]
        }
      ),
      onViewHistory && /* @__PURE__ */ jsxs6(
        "button",
        {
          onClick: onViewHistory,
          className: "inline-flex items-center gap-2 px-4 py-2 text-zinc-500 font-mono text-[10px] uppercase tracking-widest hover:text-zinc-300 transition-colors",
          children: [
            /* @__PURE__ */ jsx6(Scroll2, { size: 14 }),
            /* @__PURE__ */ jsx6("span", { children: "\u5386\u53F2\u6863\u6848" })
          ]
        }
      )
    ] })
  ] });
};
var EndGameReport_default = EndGameReport;

// virtual:components/AssessmentScreen.tsx
import { Sword, Scale, ScrollText, Skull } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs7 } from "react/jsx-runtime";
var AssessmentScreen = ({ onSelectStyle }) => {
  const options = [
    {
      id: "Conquest",
      title: "\u94C1\u8840\u5F81\u670D",
      desc: "\u201C\u771F\u7406\u53EA\u5728\u5927\u70AE\u5C04\u7A0B\u4E4B\u5185\u3002\u201D",
      sub: "\u4E13\u6CE8\u4E8E\u519B\u4E8B\u51B2\u7A81\u4E0E\u7248\u56FE\u6269\u5F20",
      icon: /* @__PURE__ */ jsx7(Sword, { className: "w-6 h-6 text-red-500" })
    },
    {
      id: "Prosperity",
      title: "\u5546\u8D38\u7E41\u8363",
      desc: "\u201C\u91D1\u94B1\u662F\u6218\u4E89\u7684\u6BCD\u4E73\u3002\u201D",
      sub: "\u4E13\u6CE8\u4E8E\u7ECF\u6D4E\u5EFA\u8BBE\u4E0E\u8D38\u6613\u5784\u65AD",
      icon: /* @__PURE__ */ jsx7(Scale, { className: "w-6 h-6 text-amber-500" })
    },
    {
      id: "Reform",
      title: "\u6587\u660E\u53D8\u9769",
      desc: "\u201C\u4E0D\u7834\u4E0D\u7ACB\uFF0C\u5927\u52BF\u6240\u8D8B\u3002\u201D",
      sub: "\u4E13\u6CE8\u4E8E\u653F\u6CBB\u6539\u9769\u3001\u6587\u5316\u4E0E\u5916\u4EA4",
      icon: /* @__PURE__ */ jsx7(ScrollText, { className: "w-6 h-6 text-emerald-500" })
    },
    {
      id: "Survival",
      title: "\u7EDD\u5883\u6C42\u751F",
      desc: "\u201C\u6D3B\u4E0B\u53BB\uFF0C\u5C31\u662F\u6700\u5927\u7684\u80DC\u5229\u3002\u201D",
      sub: "\u9AD8\u96BE\u5EA6\u7684\u5D29\u584C\u8FB9\u7F18\u5267\u672C",
      icon: /* @__PURE__ */ jsx7(Skull, { className: "w-6 h-6 text-zinc-400" })
    }
  ];
  return /* @__PURE__ */ jsx7("div", { className: "h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-6 animate-in fade-in zoom-in duration-500", children: /* @__PURE__ */ jsxs7("div", { className: "max-w-4xl w-full", children: [
    /* @__PURE__ */ jsxs7("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsx7("h2", { className: "text-zinc-500 font-mono text-xs uppercase tracking-[0.3em] mb-4", children: "Initial Assessment" }),
      /* @__PURE__ */ jsx7("h1", { className: "text-3xl md:text-5xl font-serif text-zinc-100", children: "\u8BF7\u786E\u7ACB\u4F60\u7684\u6267\u653F\u57FA\u8C03" }),
      /* @__PURE__ */ jsx7("p", { className: "text-zinc-400 mt-4 font-serif italic", children: "\u5386\u53F2\u4E0D\u4EC5\u4EC5\u662F\u6218\u4E89\uFF0C\u5B83\u53EF\u4EE5\u662F\u53D8\u9769\u3001\u662F\u7E41\u8363\u3001\u4EA6\u6216\u662F\u6C42\u5B58\u3002" })
    ] }),
    /* @__PURE__ */ jsx7("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: options.map((opt) => /* @__PURE__ */ jsxs7(
      "button",
      {
        onClick: () => onSelectStyle(opt.id),
        className: "group flex items-start gap-4 p-6 bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-600 transition-all rounded-lg text-left",
        children: [
          /* @__PURE__ */ jsx7("div", { className: "p-3 bg-zinc-950 rounded-lg group-hover:scale-110 transition-transform", children: opt.icon }),
          /* @__PURE__ */ jsxs7("div", { children: [
            /* @__PURE__ */ jsx7("h3", { className: "text-lg font-bold text-zinc-200 group-hover:text-white mb-1 font-serif", children: opt.title }),
            /* @__PURE__ */ jsx7("p", { className: "text-zinc-400 text-xs italic mb-2", children: opt.desc }),
            /* @__PURE__ */ jsx7("p", { className: "text-zinc-600 text-xs font-mono", children: opt.sub })
          ] })
        ]
      },
      opt.id
    )) })
  ] }) });
};
var AssessmentScreen_default = AssessmentScreen;

// virtual:components/SaveManager.tsx
import { useState as useState2, useEffect as useEffect2, useRef as useRef2 } from "react";
import { X, Save as Save2, Download, Upload, Trash2, FolderOpen } from "lucide-react";

// virtual:services/storageService.ts
var SAVE_VERSION = 1;
var AUTOSAVE_KEY = "chronos_autosave";
var SAVE_PREFIX = "chronos_save_";
var MAX_MANUAL_SLOTS = 5;
function buildMetadata(state, slotId) {
  return {
    slotId,
    scenarioTitle: state.scenario?.title || "\u672A\u77E5\u5267\u672C",
    nationName: state.scenario?.player_context.nation_name || "\u672A\u77E5",
    leaderTitle: state.scenario?.player_context.leader_title || "\u672A\u77E5",
    turnCount: state.turnCount,
    timestamp: Date.now()
  };
}
function buildSaveData(state, slotId) {
  return {
    metadata: buildMetadata(state, slotId),
    state,
    version: SAVE_VERSION
  };
}
function autoSave(state) {
  try {
    const data = buildSaveData(state, "autosave");
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Auto save failed:", e);
  }
}
function manualSave(state, slotIndex) {
  if (slotIndex < 0 || slotIndex >= MAX_MANUAL_SLOTS) return;
  const key = `${SAVE_PREFIX}${slotIndex}`;
  const data = buildSaveData(state, `slot_${slotIndex}`);
  localStorage.setItem(key, JSON.stringify(data));
}
function loadSave(slotId) {
  try {
    const key = slotId === "autosave" ? AUTOSAVE_KEY : `${SAVE_PREFIX}${slotId.replace("slot_", "")}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Load failed:", e);
    return null;
  }
}
function deleteSave(slotId) {
  const key = slotId === "autosave" ? AUTOSAVE_KEY : `${SAVE_PREFIX}${slotId.replace("slot_", "")}`;
  localStorage.removeItem(key);
}
function getAllSaveMetadata() {
  const results = [];
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      results.push(data.metadata);
    } else {
      results.push(null);
    }
  } catch {
    results.push(null);
  }
  for (let i = 0; i < MAX_MANUAL_SLOTS; i++) {
    try {
      const raw = localStorage.getItem(`${SAVE_PREFIX}${i}`);
      if (raw) {
        const data = JSON.parse(raw);
        results.push(data.metadata);
      } else {
        results.push(null);
      }
    } catch {
      results.push(null);
    }
  }
  return results;
}
function exportSave(slotId) {
  const data = loadSave(slotId);
  if (!data) return null;
  return JSON.stringify(data, null, 2);
}
function importSave(jsonString, targetSlotIndex) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.state || !data.metadata) return false;
    data.metadata.slotId = `slot_${targetSlotIndex}`;
    data.metadata.timestamp = Date.now();
    const key = `${SAVE_PREFIX}${targetSlotIndex}`;
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error("Import failed:", e);
    return false;
  }
}
function hasAnySave() {
  if (localStorage.getItem(AUTOSAVE_KEY)) return true;
  for (let i = 0; i < MAX_MANUAL_SLOTS; i++) {
    if (localStorage.getItem(`${SAVE_PREFIX}${i}`)) return true;
  }
  return false;
}
var HISTORY_KEY = "chronos_history";
var MAX_HISTORY_RECORDS = 50;
function saveHistoryRecord(record) {
  try {
    const records = getHistoryRecords();
    records.unshift(record);
    if (records.length > MAX_HISTORY_RECORDS) {
      records.length = MAX_HISTORY_RECORDS;
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
  } catch (e) {
    console.error("Save history record failed:", e);
  }
}
function getHistoryRecords() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function deleteHistoryRecord(id) {
  const records = getHistoryRecords().filter((r) => r.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}
function clearAllHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

// virtual:components/SaveManager.tsx
import { Fragment as Fragment2, jsx as jsx8, jsxs as jsxs8 } from "react/jsx-runtime";
var SaveManager = ({ isOpen, onClose, gameState, onLoadSave }) => {
  const [slots, setSlots] = useState2([]);
  const fileInputRef = useRef2(null);
  const [importSlot, setImportSlot] = useState2(0);
  useEffect2(() => {
    if (isOpen) {
      setSlots(getAllSaveMetadata());
    }
  }, [isOpen]);
  const refresh = () => setSlots(getAllSaveMetadata());
  const handleSave = (slotIndex) => {
    if (!gameState) return;
    manualSave(gameState, slotIndex);
    refresh();
  };
  const handleLoad = (slotId) => {
    const data = loadSave(slotId);
    if (data) {
      onLoadSave(data.state);
      onClose();
    }
  };
  const handleDelete = (slotId) => {
    deleteSave(slotId);
    refresh();
  };
  const handleExport = (slotId) => {
    const json = exportSave(slotId);
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chronos_save_${slotId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = () => {
    fileInputRef.current?.click();
  };
  const onFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (importSave(text, importSlot)) {
        refresh();
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };
  if (!isOpen) return null;
  const slotLabels = ["AUTO", "1", "2", "3", "4", "5"];
  return /* @__PURE__ */ jsx8("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxs8("div", { className: "bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-lg max-h-[85vh] flex flex-col", children: [
    /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between p-4 border-b border-zinc-800", children: [
      /* @__PURE__ */ jsxs8("h2", { className: "text-zinc-100 font-mono text-sm uppercase tracking-widest flex items-center gap-2", children: [
        /* @__PURE__ */ jsx8(Save2, { size: 16 }),
        "\u5B58\u6863\u7BA1\u7406"
      ] }),
      /* @__PURE__ */ jsx8("button", { onClick: onClose, className: "text-zinc-500 hover:text-zinc-300 transition-colors", children: /* @__PURE__ */ jsx8(X, { size: 20 }) })
    ] }),
    /* @__PURE__ */ jsx8("div", { className: "flex-1 overflow-y-auto p-4 space-y-3", children: slots.map((meta, idx) => {
      const slotId = idx === 0 ? "autosave" : `slot_${idx - 1}`;
      const isAuto = idx === 0;
      const slotLabel = slotLabels[idx];
      return /* @__PURE__ */ jsxs8("div", { className: "bg-zinc-950 border border-zinc-800 rounded-md p-3", children: [
        /* @__PURE__ */ jsx8("div", { className: "flex items-center justify-between mb-2", children: /* @__PURE__ */ jsx8("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx8("span", { className: `font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${isAuto ? "bg-emerald-900/30 text-emerald-500" : "bg-zinc-800 text-zinc-400"}`, children: isAuto ? "AUTO" : `SLOT ${slotLabel}` }) }) }),
        meta ? /* @__PURE__ */ jsxs8(Fragment2, { children: [
          /* @__PURE__ */ jsxs8("div", { className: "mb-2", children: [
            /* @__PURE__ */ jsx8("p", { className: "text-zinc-200 text-sm font-serif", children: meta.scenarioTitle }),
            /* @__PURE__ */ jsxs8("p", { className: "text-zinc-500 text-[10px] font-mono", children: [
              meta.nationName,
              " / ",
              meta.leaderTitle,
              " / \u7B2C",
              meta.turnCount,
              "\u56DE\u5408"
            ] }),
            /* @__PURE__ */ jsx8("p", { className: "text-zinc-600 text-[10px] font-mono", children: formatTime(meta.timestamp) })
          ] }),
          /* @__PURE__ */ jsxs8("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxs8(
              "button",
              {
                onClick: () => handleLoad(slotId),
                className: "flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-emerald-900/30 text-emerald-500 hover:bg-emerald-900/50 rounded transition-colors",
                children: [
                  /* @__PURE__ */ jsx8(FolderOpen, { size: 12 }),
                  " \u8BFB\u53D6"
                ]
              }
            ),
            !isAuto && gameState && /* @__PURE__ */ jsxs8(
              "button",
              {
                onClick: () => handleSave(idx - 1),
                className: "flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded transition-colors",
                children: [
                  /* @__PURE__ */ jsx8(Save2, { size: 12 }),
                  " \u8986\u76D6"
                ]
              }
            ),
            /* @__PURE__ */ jsxs8(
              "button",
              {
                onClick: () => handleExport(slotId),
                className: "flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-zinc-800 text-zinc-400 hover:bg-zinc-700 rounded transition-colors",
                children: [
                  /* @__PURE__ */ jsx8(Download, { size: 12 }),
                  " \u5BFC\u51FA"
                ]
              }
            ),
            /* @__PURE__ */ jsxs8(
              "button",
              {
                onClick: () => handleDelete(slotId),
                className: "flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded transition-colors",
                children: [
                  /* @__PURE__ */ jsx8(Trash2, { size: 12 }),
                  " \u5220\u9664"
                ]
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxs8("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx8("p", { className: "text-zinc-600 text-xs font-mono italic", children: "\u7A7A\u69FD\u4F4D" }),
          !isAuto && gameState && /* @__PURE__ */ jsxs8(
            "button",
            {
              onClick: () => handleSave(idx - 1),
              className: "flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded transition-colors",
              children: [
                /* @__PURE__ */ jsx8(Save2, { size: 12 }),
                " \u4FDD\u5B58"
              ]
            }
          )
        ] })
      ] }, idx);
    }) }),
    /* @__PURE__ */ jsxs8("div", { className: "p-4 border-t border-zinc-800 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx8(
        "select",
        {
          value: importSlot,
          onChange: (e) => setImportSlot(Number(e.target.value)),
          className: "bg-zinc-950 border border-zinc-700 text-zinc-300 text-xs font-mono rounded px-2 py-1.5",
          children: [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxs8("option", { value: i, children: [
            "\u69FD\u4F4D ",
            i + 1
          ] }, i))
        }
      ),
      /* @__PURE__ */ jsxs8(
        "button",
        {
          onClick: handleImport,
          className: "flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase bg-amber-900/30 text-amber-400 hover:bg-amber-900/50 rounded transition-colors",
          children: [
            /* @__PURE__ */ jsx8(Upload, { size: 12 }),
            " \u5BFC\u5165JSON"
          ]
        }
      ),
      /* @__PURE__ */ jsx8(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: ".json",
          className: "hidden",
          onChange: onFileSelected
        }
      )
    ] })
  ] }) });
};
var SaveManager_default = SaveManager;

// virtual:components/HistoryArchive.tsx
import { useState as useState3, useEffect as useEffect3 } from "react";
import { X as X2, Trash2 as Trash22, ChevronDown, ChevronUp, AlertOctagon, Trophy, Minus, Scroll as Scroll3 } from "lucide-react";
import { Radar as Radar2, RadarChart as RadarChart2, PolarGrid as PolarGrid2, PolarAngleAxis as PolarAngleAxis2, PolarRadiusAxis as PolarRadiusAxis2, ResponsiveContainer as ResponsiveContainer2 } from "recharts";
import { Fragment as Fragment3, jsx as jsx9, jsxs as jsxs9 } from "react/jsx-runtime";
var traitMap2 = {
  "Authority": "\u6743\u5A01",
  "Strategy": "\u8C0B\u7565",
  "Empathy": "\u4EC1\u5FB7",
  "Vision": "\u8FDC\u89C1",
  "Economy": "\u7ECF\u6D4E",
  "Iron Fist": "\u94C1\u8840",
  "Cunning": "\u72E1\u8BC8",
  "Benevolence": "\u4EC1\u6148"
};
var outcomeConfig = {
  victory: { label: "\u80DC\u5229", color: "text-emerald-500", icon: /* @__PURE__ */ jsx9(Trophy, { size: 14 }) },
  defeat: { label: "\u8D25\u4EA1", color: "text-red-500", icon: /* @__PURE__ */ jsx9(AlertOctagon, { size: 14 }) },
  neutral: { label: "\u4E2D\u7ACB", color: "text-amber-500", icon: /* @__PURE__ */ jsx9(Minus, { size: 14 }) }
};
var HistoryArchive = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState3([]);
  const [expandedId, setExpandedId] = useState3(null);
  useEffect3(() => {
    if (isOpen) {
      setRecords(getHistoryRecords());
    }
  }, [isOpen]);
  const refresh = () => setRecords(getHistoryRecords());
  const handleDelete = (id) => {
    deleteHistoryRecord(id);
    refresh();
  };
  const handleClearAll = () => {
    clearAllHistory();
    refresh();
  };
  const formatDate = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx9("div", { className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxs9("div", { className: "bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col", children: [
    /* @__PURE__ */ jsxs9("div", { className: "flex items-center justify-between p-4 border-b border-zinc-800", children: [
      /* @__PURE__ */ jsxs9("h2", { className: "text-zinc-100 font-mono text-sm uppercase tracking-widest flex items-center gap-2", children: [
        /* @__PURE__ */ jsx9(Scroll3, { size: 16 }),
        "\u5386\u53F2\u6863\u6848"
      ] }),
      /* @__PURE__ */ jsx9("button", { onClick: onClose, className: "text-zinc-500 hover:text-zinc-300 transition-colors", children: /* @__PURE__ */ jsx9(X2, { size: 20 }) })
    ] }),
    /* @__PURE__ */ jsx9("div", { className: "flex-1 overflow-y-auto p-4 space-y-3", children: records.length === 0 ? /* @__PURE__ */ jsxs9("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx9(Scroll3, { size: 32, className: "mx-auto text-zinc-700 mb-3" }),
      /* @__PURE__ */ jsx9("p", { className: "text-zinc-600 font-mono text-sm", children: "\u5C1A\u65E0\u5386\u53F2\u8BB0\u5F55" }),
      /* @__PURE__ */ jsx9("p", { className: "text-zinc-700 font-mono text-[10px] mt-1", children: "\u5B8C\u6210\u4E00\u5C40\u6E38\u620F\u540E\u5C06\u5728\u6B64\u663E\u793A" })
    ] }) : records.map((record) => {
      const oc = outcomeConfig[record.outcome];
      const isExpanded = expandedId === record.id;
      return /* @__PURE__ */ jsxs9("div", { className: "bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden", children: [
        /* @__PURE__ */ jsxs9(
          "button",
          {
            onClick: () => setExpandedId(isExpanded ? null : record.id),
            className: "w-full p-3 flex items-center gap-3 hover:bg-zinc-900/50 transition-colors text-left",
            children: [
              /* @__PURE__ */ jsxs9("div", { className: `flex items-center gap-1 shrink-0 ${oc.color}`, children: [
                oc.icon,
                /* @__PURE__ */ jsx9("span", { className: "text-[10px] font-mono uppercase", children: oc.label })
              ] }),
              /* @__PURE__ */ jsxs9("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx9("p", { className: "text-zinc-200 text-sm font-serif truncate", children: record.scenarioTitle }),
                /* @__PURE__ */ jsxs9("p", { className: "text-zinc-600 text-[10px] font-mono", children: [
                  record.nationName,
                  " / ",
                  record.leaderTitle,
                  " / ",
                  record.turnCount,
                  "\u56DE\u5408 / ",
                  formatDate(record.date)
                ] })
              ] }),
              /* @__PURE__ */ jsx9("div", { className: "shrink-0 text-zinc-600", children: isExpanded ? /* @__PURE__ */ jsx9(ChevronUp, { size: 16 }) : /* @__PURE__ */ jsx9(ChevronDown, { size: 16 }) })
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ jsxs9("div", { className: "border-t border-zinc-800 p-4 space-y-4", children: [
          /* @__PURE__ */ jsxs9("div", { children: [
            /* @__PURE__ */ jsx9("h4", { className: "text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-2", children: "\u6700\u7EC8\u5C5E\u6027" }),
            /* @__PURE__ */ jsxs9("div", { className: "grid grid-cols-2 gap-2 text-xs font-mono", children: [
              /* @__PURE__ */ jsxs9("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-500", children: "\u793E\u4F1A\u7A33\u5B9A" }),
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-300", children: record.finalStats.stability })
              ] }),
              /* @__PURE__ */ jsxs9("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-500", children: "\u7ECF\u6D4E\u72B6\u51B5" }),
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-300", children: record.finalStats.economy })
              ] }),
              /* @__PURE__ */ jsxs9("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-500", children: "\u519B\u4E8B\u529B\u91CF" }),
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-300", children: record.finalStats.military })
              ] }),
              /* @__PURE__ */ jsxs9("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-500", children: "\u56FD\u9645\u58F0\u671B" }),
                /* @__PURE__ */ jsx9("span", { className: "text-zinc-300", children: record.finalStats.international_standing })
              ] })
            ] })
          ] }),
          record.analysis && /* @__PURE__ */ jsxs9(Fragment3, { children: [
            /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx9("h4", { className: "text-amber-500 font-mono text-[10px] uppercase tracking-widest mb-2", children: "\u5386\u53F2\u539F\u578B" }),
              /* @__PURE__ */ jsx9("p", { className: "text-zinc-200 text-sm font-serif", children: record.realEventTitle })
            ] }),
            /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx9("h4", { className: "text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-2", children: "\u7EDF\u6CBB\u8005\u753B\u50CF" }),
              /* @__PURE__ */ jsx9("p", { className: "text-zinc-200 text-sm font-bold", children: record.analysis.persona_title }),
              record.analysis.similar_historical_figure && /* @__PURE__ */ jsxs9("p", { className: "text-zinc-500 text-[10px] font-mono mt-1", children: [
                "\u76F8\u4F3C\u4EBA\u7269: ",
                record.analysis.similar_historical_figure
              ] })
            ] }),
            record.analysis.radar_stats && record.analysis.radar_stats.length > 0 && /* @__PURE__ */ jsx9("div", { className: "w-full h-48", children: /* @__PURE__ */ jsx9(ResponsiveContainer2, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxs9(RadarChart2, { cx: "50%", cy: "50%", outerRadius: "75%", data: record.analysis.radar_stats, children: [
              /* @__PURE__ */ jsx9(PolarGrid2, { stroke: "#3f3f46" }),
              /* @__PURE__ */ jsx9(
                PolarAngleAxis2,
                {
                  dataKey: "dimension",
                  tickFormatter: (val) => traitMap2[val] || val,
                  tick: { fill: "#a1a1aa", fontSize: 9, fontFamily: "monospace" }
                }
              ),
              /* @__PURE__ */ jsx9(PolarRadiusAxis2, { angle: 30, domain: [0, 100], tick: false, axisLine: false }),
              /* @__PURE__ */ jsx9(
                Radar2,
                {
                  name: "Persona",
                  dataKey: "value",
                  stroke: "#10b981",
                  strokeWidth: 2,
                  fill: "#10b981",
                  fillOpacity: 0.2
                }
              )
            ] }) }) }),
            record.analysis.comparison_text && /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx9("h4", { className: "text-emerald-500 font-mono text-[10px] uppercase tracking-widest mb-2", children: "\u5BF9\u6BD4\u5206\u6790" }),
              /* @__PURE__ */ jsx9("p", { className: "text-zinc-400 text-xs font-serif leading-relaxed", children: record.analysis.comparison_text })
            ] })
          ] }),
          /* @__PURE__ */ jsx9("div", { className: "pt-2 border-t border-zinc-800", children: /* @__PURE__ */ jsxs9(
            "button",
            {
              onClick: () => handleDelete(record.id),
              className: "flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded transition-colors",
              children: [
                /* @__PURE__ */ jsx9(Trash22, { size: 12 }),
                " \u5220\u9664\u6B64\u8BB0\u5F55"
              ]
            }
          ) })
        ] })
      ] }, record.id);
    }) }),
    records.length > 0 && /* @__PURE__ */ jsxs9("div", { className: "p-4 border-t border-zinc-800 flex justify-between items-center", children: [
      /* @__PURE__ */ jsxs9("span", { className: "text-zinc-600 font-mono text-[10px]", children: [
        records.length,
        " \u6761\u8BB0\u5F55"
      ] }),
      /* @__PURE__ */ jsxs9(
        "button",
        {
          onClick: handleClearAll,
          className: "flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono uppercase bg-red-900/30 text-red-400 hover:bg-red-900/50 rounded transition-colors",
          children: [
            /* @__PURE__ */ jsx9(Trash22, { size: 12 }),
            " \u6E05\u9664\u5168\u90E8"
          ]
        }
      )
    ] })
  ] }) });
};
var HistoryArchive_default = HistoryArchive;

// virtual:components/DisclaimerModal.tsx
import { AlertTriangle as AlertTriangle2, Sparkles, Users as Users2, Shield as Shield2 } from "lucide-react";
import { jsx as jsx10, jsxs as jsxs10 } from "react/jsx-runtime";
var DisclaimerModal = ({ isOpen, onAccept }) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx10("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs10("div", { className: "bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs10("div", { className: "sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx10("div", { className: "p-2 rounded-full bg-amber-500/10", children: /* @__PURE__ */ jsx10(AlertTriangle2, { className: "w-5 h-5 text-amber-500" }) }),
      /* @__PURE__ */ jsx10("h2", { className: "text-lg font-serif text-zinc-100", children: "\u4F7F\u7528\u987B\u77E5" })
    ] }),
    /* @__PURE__ */ jsxs10("div", { className: "p-4 space-y-4", children: [
      /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2 text-zinc-300", children: [
          /* @__PURE__ */ jsx10(Sparkles, { size: 14, className: "text-amber-500" }),
          /* @__PURE__ */ jsx10("span", { className: "font-mono text-xs uppercase tracking-wider", children: "\u539F\u578B\u8BF4\u660E" })
        ] }),
        /* @__PURE__ */ jsx10("p", { className: "text-zinc-400 text-sm leading-relaxed pl-5", children: "\u672C\u5E94\u7528\u6240\u6709\u573A\u666F\u5747\u57FA\u4E8E\u5386\u53F2\u539F\u578B\u8131\u654F\u5904\u7406\u3002AI \u6240\u5448\u73B0\u7684\u53D9\u4E8B\u4EC5\u4E3A\u57FA\u4E8E\u7279\u5B9A\u7B97\u6CD5\u903B\u8F91\u7684\u6587\u5B66\u60F3\u8C61\uFF0C\u4E0D\u4EE3\u8868\u771F\u5B9E\u5386\u53F2\u8BB0\u5F55\uFF0C\u4EA6\u4E0D\u6784\u6210\u4EFB\u4F55\u5B66\u672F\u5B9A\u8BBA\u6216\u4EF7\u503C\u5BFC\u5411\u3002" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2 text-zinc-300", children: [
          /* @__PURE__ */ jsx10(Sparkles, { size: 14, className: "text-emerald-500" }),
          /* @__PURE__ */ jsx10("span", { className: "font-mono text-xs uppercase tracking-wider", children: "\u5E73\u884C\u903B\u8F91" })
        ] }),
        /* @__PURE__ */ jsx10("p", { className: "text-zinc-400 text-sm leading-relaxed pl-5", children: '\u60A8\u6B63\u5904\u4E8E\u4E00\u4E2A\u7531 AI \u8F85\u52A9\u6784\u5EFA\u7684"\u5E73\u884C\u7A7A\u95F4"\u3002\u5728\u8FD9\u91CC\uFF0C\u6BCF\u4E00\u6B21\u9009\u62E9\u90FD\u5C06\u884D\u751F\u51FA\u72EC\u7ACB\u4E8E\u73B0\u5B9E\u5386\u53F2\u4E4B\u5916\u7684\u865A\u6784\u8D70\u5411\u3002\u8BF7\u77E5\u6089\uFF0C\u7A7A\u95F4\u5185\u7684\u4E00\u5207\u4E92\u52A8\u4EA7\u7269\u5747\u4E3A\u7B97\u6CD5\u5B9E\u65F6\u751F\u6210\u7684\u865A\u6784\u5185\u5BB9\u3002' })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2 text-zinc-300", children: [
          /* @__PURE__ */ jsx10(Users2, { size: 14, className: "text-blue-500" }),
          /* @__PURE__ */ jsx10("span", { className: "font-mono text-xs uppercase tracking-wider", children: "\u7528\u6237\u5171\u521B" })
        ] }),
        /* @__PURE__ */ jsx10("p", { className: "text-zinc-400 text-sm leading-relaxed pl-5", children: "\u672C\u5E94\u7528\u9F13\u52B1\u7528\u6237\u8FDB\u884C\u5408\u89C4\u3001\u79EF\u6781\u7684\u521B\u610F\u4E92\u52A8\u3002\u7528\u6237\u4E92\u52A8\u4EA7\u751F\u7684\u5185\u5BB9\u7531 AI \u7B97\u6CD5\u751F\u6210\uFF0C\u4E0D\u4EE3\u8868\u672C\u5E73\u53F0\u7ACB\u573A\u3002\u5982\u53D1\u73B0\u4E0D\u5F53\u5185\u5BB9\uFF0C\u6B22\u8FCE\u53CD\u9988\u3002" })
      ] }),
      /* @__PURE__ */ jsxs10("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs10("div", { className: "flex items-center gap-2 text-zinc-300", children: [
          /* @__PURE__ */ jsx10(Shield2, { size: 14, className: "text-purple-500" }),
          /* @__PURE__ */ jsx10("span", { className: "font-mono text-xs uppercase tracking-wider", children: "\u5408\u89C4\u63D0\u793A" })
        ] }),
        /* @__PURE__ */ jsx10("p", { className: "text-zinc-400 text-sm leading-relaxed pl-5", children: "\u672C\u5E94\u7528\u4F7F\u7528\u751F\u6210\u5F0F\u4EBA\u5DE5\u667A\u80FD\u6280\u672F\uFF0C\u76F8\u5173\u5185\u5BB9\u9075\u5B88\u300A\u751F\u6210\u5F0F\u4EBA\u5DE5\u667A\u80FD\u670D\u52A1\u7BA1\u7406\u6682\u884C\u529E\u6CD5\u300B\u3002AI \u751F\u6210\u5185\u5BB9\u53EF\u80FD\u5B58\u5728\u4E8B\u5B9E\u504F\u5DEE\u6216\u4E0D\u51C6\u786E\u4E4B\u5904\uFF0C\u6211\u4EEC\u5C06\u6301\u7EED\u4F18\u5316\u7B97\u6CD5\u5B89\u5168\u6A21\u578B\u3002" })
      ] }),
      /* @__PURE__ */ jsx10("div", { className: "space-y-2 pt-2 border-t border-zinc-800", children: /* @__PURE__ */ jsxs10("p", { className: "text-zinc-500 text-xs leading-relaxed", children: [
        "\u53CD\u9988\u6E20\u9053\uFF1A\u90AE\u7BB1 ",
        /* @__PURE__ */ jsx10("a", { href: "mailto:novaflow@gmail.com", className: "text-zinc-400 underline", children: "novaflow@gmail.com" }),
        " / \u5C0F\u7EA2\u4E66 ",
        /* @__PURE__ */ jsx10("span", { className: "text-zinc-400", children: "@Gapp.so" }),
        "\uFF08ID: 95448591499\uFF09"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx10("div", { className: "sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4", children: /* @__PURE__ */ jsx10(
      "button",
      {
        onClick: onAccept,
        className: "w-full py-3 bg-zinc-100 text-zinc-900 font-mono text-sm uppercase tracking-widest hover:bg-white active:scale-[0.98] transition-all rounded",
        children: "\u6211\u5DF2\u77E5\u6089\uFF0C\u8FDB\u5165\u6E38\u620F"
      }
    ) })
  ] }) });
};
var DisclaimerModal_default = DisclaimerModal;

// virtual:App.tsx
import { Globe, BookOpen as BookOpen3, FolderOpen as FolderOpen2, Save as Save3, Scroll as Scroll4 } from "lucide-react";
import { Fragment as Fragment4, jsx as jsx11, jsxs as jsxs11 } from "react/jsx-runtime";
var DISCLAIMER_ACCEPTED_KEY = "chronos_disclaimer_accepted";
var initialState = {
  phase: 0 /* START */,
  scenario: null,
  historyLog: [],
  turnCount: 0,
  stats: INITIAL_STATS,
  currentTurnResult: null,
  endGameAnalysis: null
};
function gameReducer(state, action) {
  switch (action.type) {
    case "ENTER_SELECTION":
      return { ...state, phase: 1 /* SELECTION */ };
    case "SET_SCENARIO":
      return {
        ...state,
        phase: 2 /* PLAYING */,
        scenario: action.payload,
        stats: action.payload.initial_stats,
        turnCount: 1
      };
    case "PROCESS_TURN":
      const newStats = {
        stability: Math.max(0, Math.min(100, state.stats.stability + action.payload.result.stats_delta.stability)),
        economy: Math.max(0, Math.min(100, state.stats.economy + action.payload.result.stats_delta.economy)),
        military: Math.max(0, Math.min(100, state.stats.military + action.payload.result.stats_delta.military)),
        international_standing: Math.max(0, Math.min(100, state.stats.international_standing + action.payload.result.stats_delta.international_standing))
      };
      const updatedScenario = state.scenario && action.payload.result.factions_update ? {
        ...state.scenario,
        factions: action.payload.result.factions_update.filter((f) => !f.is_destroyed)
      } : state.scenario;
      return {
        ...state,
        scenario: updatedScenario,
        turnCount: state.turnCount + 1,
        stats: newStats,
        currentTurnResult: action.payload.result,
        historyLog: [
          ...state.historyLog,
          `\u7B2C ${state.turnCount} \u56DE\u5408: \u7528\u6237\u51B3\u7B56: "${action.payload.action}". \u7ED3\u679C: ${action.payload.result.hidden_consequences}`
        ]
      };
    case "GAME_OVER":
      return {
        ...state,
        phase: 4 /* ENDED */,
        endGameAnalysis: action.payload
      };
    case "LOAD_SAVE":
      return { ...action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}
function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [loadingMsg, setLoadingMsg] = useState4("");
  const [showSaveManager, setShowSaveManager] = useState4(false);
  const [showHistoryArchive, setShowHistoryArchive] = useState4(false);
  const [hasSaves, setHasSaves] = useState4(false);
  const [showDisclaimer, setShowDisclaimer] = useState4(false);
  useEffect4(() => {
    setHasSaves(hasAnySave());
    const accepted = localStorage.getItem(DISCLAIMER_ACCEPTED_KEY);
    if (!accepted) {
      setShowDisclaimer(true);
    }
  }, []);
  const handleAcceptDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_ACCEPTED_KEY, "true");
    setShowDisclaimer(false);
  };
  useEffect4(() => {
    if (state.phase === 2 /* PLAYING */ && state.turnCount > 1) {
      autoSave(state);
    }
  }, [state.turnCount, state.phase]);
  const enterSelection = () => {
    dispatch({ type: "ENTER_SELECTION" });
  };
  const handleContinueGame = () => {
    const data = loadSave("autosave");
    if (data) {
      dispatch({ type: "LOAD_SAVE", payload: data.state });
    } else {
      setShowSaveManager(true);
    }
  };
  const handleLoadSave = (savedState) => {
    dispatch({ type: "LOAD_SAVE", payload: savedState });
  };
  const startGame = async (style) => {
    setLoadingMsg(`\u6B63\u5728\u6839\u636E [${style}] \u5267\u672C\u6784\u5EFA\u4E16\u754C\u7EBF...`);
    try {
      const playedEvents = getHistoryRecords().map((r) => r.realEventTitle);
      const scenario = await generateScenario(style, playedEvents);
      dispatch({ type: "SET_SCENARIO", payload: scenario });
    } catch (error) {
      console.error("Failed to start", error);
      setLoadingMsg("\u9519\u8BEF: \u8FDE\u63A5\u4E22\u5931\u3002\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002");
    }
    setLoadingMsg("");
  };
  const handleAction = async (userAction) => {
    if (!state.scenario) return;
    setLoadingMsg("\u6B63\u5728\u63A8\u6F14\u5730\u7F18\u653F\u6CBB\u540E\u679C...");
    try {
      const result = await evaluateTurn(state.scenario, state.historyLog, userAction, state.stats, state.turnCount);
      dispatch({ type: "PROCESS_TURN", payload: { action: userAction, result } });
      const postStats = {
        stability: Math.max(0, Math.min(100, state.stats.stability + result.stats_delta.stability)),
        economy: Math.max(0, Math.min(100, state.stats.economy + result.stats_delta.economy)),
        military: Math.max(0, Math.min(100, state.stats.military + result.stats_delta.military)),
        international_standing: Math.max(0, Math.min(100, state.stats.international_standing + result.stats_delta.international_standing))
      };
      const anyStatZero = Object.values(postStats).some((v) => v <= 0);
      const nextTurn = state.turnCount + 1;
      const statsAvg = Object.values(postStats).reduce((a, b) => a + b, 0) / 4;
      const hardCap = nextTurn > HARD_CAP_TURNS;
      const collapse = anyStatZero && nextTurn > MIN_TURNS_BEFORE_END;
      const aiEnded = result.is_game_over && nextTurn > MIN_TURNS_BEFORE_END;
      const perfectVictory = statsAvg >= PERFECT_VICTORY_AVG;
      if (hardCap || collapse || aiEnded || perfectVictory) {
        await handleEndGame(state.scenario, [...state.historyLog, `\u6700\u7EC8\u56DE\u5408: ${result.hidden_consequences}`]);
      }
    } catch (error) {
      console.error("Turn failed", error);
      setLoadingMsg("\u9519\u8BEF: \u63A8\u6F14\u540C\u6B65\u5931\u8D25\u3002\u8BF7\u91CD\u8BD5\u3002");
      setTimeout(() => setLoadingMsg(""), 3e3);
    }
    setLoadingMsg("");
  };
  const determineOutcome = (stats) => {
    const vals = [stats.stability, stats.economy, stats.military, stats.international_standing];
    const anyZero = vals.some((v) => v <= 0);
    if (anyZero) return "defeat";
    const avg = vals.reduce((a, b) => a + b, 0) / 4;
    if (avg >= VICTORY_AVG) return "victory";
    if (avg >= DEFEAT_AVG) return "neutral";
    return "defeat";
  };
  const handleEndGame = async (scenario, finalHistory) => {
    setLoadingMsg("\u6B63\u5728\u89E3\u5BC6\u5386\u53F2\u6863\u6848...");
    try {
      const analysis = await analyzeGame(scenario, finalHistory);
      const outcome = determineOutcome(state.stats);
      saveHistoryRecord({
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        scenarioTitle: scenario.title,
        nationName: scenario.player_context.nation_name,
        leaderTitle: scenario.player_context.leader_title,
        realEventTitle: analysis.real_event_title || scenario.hidden_real_event,
        turnCount: state.turnCount,
        date: Date.now(),
        outcome,
        finalStats: { ...state.stats },
        analysis
      });
      dispatch({ type: "GAME_OVER", payload: analysis });
    } catch (error) {
      console.error("End game analysis failed", error);
    }
    setLoadingMsg("");
  };
  const handleRestart = () => {
    dispatch({ type: "RESET" });
  };
  const handleManualEndGame = async () => {
    if (!state.scenario) return;
    await handleEndGame(state.scenario, state.historyLog);
  };
  const renderPhase = () => {
    if (loadingMsg) {
      return /* @__PURE__ */ jsx11(LoadingScreen_default, { message: loadingMsg });
    }
    if (state.phase === 0 /* START */) {
      return /* @__PURE__ */ jsxs11("div", { className: "h-[100dvh] w-full flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden", children: [
        /* @__PURE__ */ jsx11("div", { className: "absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none", children: /* @__PURE__ */ jsxs11("div", { className: "grid grid-cols-6 md:grid-cols-12 h-full", children: [
          Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ jsx11("div", { className: "border-r border-zinc-500 h-full hidden md:block" }, i)),
          Array.from({ length: 6 }).map((_, i) => /* @__PURE__ */ jsx11("div", { className: "border-r border-zinc-500 h-full md:hidden" }, i))
        ] }) }),
        /* @__PURE__ */ jsxs11("div", { className: "z-10 max-w-2xl text-center space-y-6 md:space-y-8", children: [
          /* @__PURE__ */ jsx11("div", { className: "mb-4 md:mb-6 flex justify-center", children: /* @__PURE__ */ jsx11("div", { className: "p-3 md:p-4 rounded-full bg-zinc-900 border border-zinc-800", children: /* @__PURE__ */ jsx11(Globe, { className: "w-8 h-8 md:w-12 md:h-12 text-zinc-200" }) }) }),
          /* @__PURE__ */ jsx11("h1", { className: "text-4xl md:text-7xl font-serif text-zinc-100 tracking-tight", children: "CHRONOS" }),
          /* @__PURE__ */ jsx11("p", { className: "text-zinc-400 font-mono text-[10px] md:text-sm uppercase tracking-[0.3em]", children: "\u5386\u53F2\u7684\u56DE\u54CD / \u51B3\u7B56\u63A8\u6F14" }),
          /* @__PURE__ */ jsx11("p", { className: "text-base md:text-lg text-zinc-500 font-serif italic max-w-xs md:max-w-md mx-auto leading-relaxed px-4", children: '"\u5386\u53F2\u4E0D\u662F\u8BB0\u5FC6\u7684\u8D1F\u62C5\uFF0C\u800C\u662F\u7075\u9B42\u7684\u542F\u8FEA\u3002"' }),
          /* @__PURE__ */ jsxs11("div", { className: "pt-4 flex flex-col items-center gap-3", children: [
            /* @__PURE__ */ jsxs11(
              "button",
              {
                onClick: enterSelection,
                className: "group relative inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-zinc-100 text-zinc-950 font-mono text-sm md:text-base font-bold tracking-widest uppercase hover:bg-white active:scale-95 transition-all duration-300",
                children: [
                  /* @__PURE__ */ jsx11(BookOpen3, { size: 18 }),
                  /* @__PURE__ */ jsx11("span", { children: "\u8FDB\u5165\u5386\u53F2" })
                ]
              }
            ),
            hasSaves && /* @__PURE__ */ jsxs11(
              "button",
              {
                onClick: handleContinueGame,
                className: "group relative inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-zinc-900 text-zinc-300 border border-zinc-700 font-mono text-sm md:text-base tracking-widest uppercase hover:bg-zinc-800 active:scale-95 transition-all duration-300",
                children: [
                  /* @__PURE__ */ jsx11(FolderOpen2, { size: 18 }),
                  /* @__PURE__ */ jsx11("span", { children: "\u7EE7\u7EED\u6E38\u620F" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs11(
              "button",
              {
                onClick: () => setShowSaveManager(true),
                className: "inline-flex items-center gap-2 px-4 py-2 text-zinc-600 font-mono text-[10px] uppercase tracking-widest hover:text-zinc-400 transition-colors",
                children: [
                  /* @__PURE__ */ jsx11(Save3, { size: 14 }),
                  /* @__PURE__ */ jsx11("span", { children: "\u5B58\u6863\u7BA1\u7406" })
                ]
              }
            ),
            /* @__PURE__ */ jsxs11(
              "button",
              {
                onClick: () => setShowHistoryArchive(true),
                className: "inline-flex items-center gap-2 px-4 py-2 text-zinc-600 font-mono text-[10px] uppercase tracking-widest hover:text-zinc-400 transition-colors",
                children: [
                  /* @__PURE__ */ jsx11(Scroll4, { size: 14 }),
                  /* @__PURE__ */ jsx11("span", { children: "\u5386\u53F2\u6863\u6848" })
                ]
              }
            )
          ] })
        ] })
      ] });
    }
    if (state.phase === 1 /* SELECTION */) {
      return /* @__PURE__ */ jsx11(AssessmentScreen_default, { onSelectStyle: startGame });
    }
    if (state.phase === 2 /* PLAYING */) {
      return /* @__PURE__ */ jsx11(
        GameInterface_default,
        {
          gameState: state,
          onAction: handleAction,
          isProcessing: !!loadingMsg,
          onOpenSaveManager: () => setShowSaveManager(true),
          onEndGame: handleManualEndGame
        }
      );
    }
    if (state.phase === 4 /* ENDED */ && state.endGameAnalysis) {
      return /* @__PURE__ */ jsx11("div", { className: "h-[100dvh] overflow-y-auto bg-zinc-950", children: /* @__PURE__ */ jsx11(
        EndGameReport_default,
        {
          data: state.endGameAnalysis,
          onRestart: handleRestart,
          onViewHistory: () => setShowHistoryArchive(true)
        }
      ) });
    }
    return null;
  };
  return /* @__PURE__ */ jsxs11(Fragment4, { children: [
    renderPhase(),
    /* @__PURE__ */ jsx11(
      SaveManager_default,
      {
        isOpen: showSaveManager,
        onClose: () => setShowSaveManager(false),
        gameState: state.phase === 2 /* PLAYING */ ? state : null,
        onLoadSave: handleLoadSave
      }
    ),
    /* @__PURE__ */ jsx11(
      HistoryArchive_default,
      {
        isOpen: showHistoryArchive,
        onClose: () => setShowHistoryArchive(false)
      }
    ),
    /* @__PURE__ */ jsx11(
      DisclaimerModal_default,
      {
        isOpen: showDisclaimer,
        onAccept: handleAcceptDisclaimer
      }
    )
  ] });
}

// virtual:index.tsx
import { jsx as jsx12 } from "react/jsx-runtime";
var rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
var root = ReactDOM.createRoot(rootElement);
root.render(
  /* @__PURE__ */ jsx12(React5.StrictMode, { children: /* @__PURE__ */ jsx12(App, {}) })
);

  
