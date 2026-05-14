export interface SandTableFaction {
  id: string;
  name: string;
  nodes: { x: number; y: number }[];
  power: number;
  targetPower: number;
  rgb: [number, number, number];
  isPlayer: boolean;
  dead: boolean;
  direction: string;
}

export interface SandTableRegion {
  name: string;
  x: number;
  y: number;
  terrainType: "plains" | "mountain" | "desert" | "forest" | "water" | "tundra";
  friction: number;
}

export interface SandTableFactionUpdate {
  name: string;
  power_delta: number;
}

export interface SandTableTurnUpdate {
  factions: SandTableFactionUpdate[];
}

export interface SandTableMapResult {
  factions: SandTableFaction[];
  regions: SandTableRegion[];
}

export interface SandTableState {
  factions: SandTableFaction[];
  regions: SandTableRegion[];
  mapWidth: number;
  mapHeight: number;
  lastUpdateTurn: number;
}
