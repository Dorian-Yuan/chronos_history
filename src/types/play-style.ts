export type PlayStyle =
  | "Conquest"
  | "Prosperity"
  | "Reform"
  | "Survival"
  | "Officialdom";

export interface PlayStyleOption {
  id: PlayStyle;
  name: string;
  description: string;
  quote: string;
}

export const PLAY_STYLES: PlayStyleOption[] = [
  {
    id: "Conquest",
    name: "铁血征服",
    description: "专注于军事冲突与版图扩张",
    quote: "真理只在大炮射程之内。",
  },
  {
    id: "Prosperity",
    name: "商贸繁荣",
    description: "专注于经济建设与贸易垄断",
    quote: "金钱是战争的母乳。",
  },
  {
    id: "Reform",
    name: "文明变革",
    description: "专注于政治改革、文化与外交",
    quote: "不破不立，大势所趋。",
  },
  {
    id: "Survival",
    name: "绝境求生",
    description: "高难度的崩溃边缘剧本",
    quote: "活下去，就是最大的胜利。",
  },
  {
    id: "Officialdom",
    name: "宦海沉浮",
    description: "居庙堂之高则忧其民",
    quote: "如临深渊，如履薄冰。",
  },
];
