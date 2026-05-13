export type LifeMode = "Officialdom";

export interface LifeModeOption {
  id: LifeMode;
  name: string;
  description: string;
  quote: string;
}

export const LIFE_MODES: LifeModeOption[] = [
  {
    id: "Officialdom",
    name: "宦海浮沉",
    description: "居庙堂之高则忧其民",
    quote: "如临深渊，如履薄冰。",
  },
];
