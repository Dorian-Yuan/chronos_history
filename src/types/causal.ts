export interface CausalNode {
  id: string;
  turnIndex: number;
  year: number;
  decision: string;
  consequence: string;
  parentIds: string[];
  childIds: string[];
}

export interface CharacterRelation {
  characterId: string;
  characterName: string;
  relatedTo: string;
  relatedToName: string;
  relationType: "ally" | "rival" | "subordinate" | "superior" | "neutral";
  strength: number;
  description: string;
}
