import type { PlayStyle } from "@/types";

export interface TerminologyConfig {
  cabinetLabel: string;
  advisorLabel: string;
  counselLabel: string;
  courtDebateLabel: string;
  chronicleLabel: string;
  chroniclePrompt: string;
  courtDebatePrompt: string;
}

export const TERMINOLOGY: Record<PlayStyle, TerminologyConfig> = {
  Conquest: {
    cabinetLabel: "内阁",
    advisorLabel: "顾问",
    counselLabel: "密谈",
    courtDebateLabel: "廷议",
    chronicleLabel: "编年史",
    chroniclePrompt: "阁下，作为{title}，您的第一道政令是什么？",
    courtDebatePrompt: "{title}，可在朝堂上提出议题，令群臣廷议",
  },
  Prosperity: {
    cabinetLabel: "内阁",
    advisorLabel: "顾问",
    counselLabel: "密谈",
    courtDebateLabel: "廷议",
    chronicleLabel: "编年史",
    chroniclePrompt: "阁下，作为{title}，您的第一道政令是什么？",
    courtDebatePrompt: "{title}，可在朝堂上提出议题，令群臣廷议",
  },
  Reform: {
    cabinetLabel: "内阁",
    advisorLabel: "顾问",
    counselLabel: "密谈",
    courtDebateLabel: "廷议",
    chronicleLabel: "编年史",
    chroniclePrompt: "阁下，作为{title}，您的第一道政令是什么？",
    courtDebatePrompt: "{title}，可在朝堂上提出议题，令群臣廷议",
  },
  Survival: {
    cabinetLabel: "内阁",
    advisorLabel: "顾问",
    counselLabel: "密谈",
    courtDebateLabel: "廷议",
    chronicleLabel: "编年史",
    chroniclePrompt: "阁下，作为{title}，您的第一道政令是什么？",
    courtDebatePrompt: "{title}，可在朝堂上提出议题，令群臣廷议",
  },
  Officialdom: {
    cabinetLabel: "幕僚",
    advisorLabel: "同僚",
    counselLabel: "私议",
    courtDebateLabel: "议事",
    chronicleLabel: "履历",
    chroniclePrompt: "大人，身为{title}，您打算如何行事？",
    courtDebatePrompt: "{title}，可提出议题，与同僚议事",
  },
};
