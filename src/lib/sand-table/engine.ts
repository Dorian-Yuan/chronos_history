import type {
  SandTableFaction,
  SandTableRegion,
  SandTableState,
} from "@/types";

const SCALE = 3;
const BASE_DEFENSE = 6.0;

const FACTION_COLORS: [number, number, number][] = [
  [46, 206, 139],
  [214, 69, 65],
  [65, 131, 215],
  [232, 131, 58],
  [155, 142, 196],
  [201, 168, 76],
  [38, 166, 91],
  [232, 90, 90],
];

export function assignFactionColors(
  factions: SandTableFaction[],
): SandTableFaction[] {
  let colorIdx = 0;
  return factions.map((f) => {
    if (f.isPlayer) {
      return { ...f, rgb: FACTION_COLORS[0] };
    }
    colorIdx++;
    const color = FACTION_COLORS[colorIdx % FACTION_COLORS.length];
    return { ...f, rgb: color };
  });
}

export interface TerrainSeed {
  seedX: number;
  seedY: number;
  seedZ: number;
}

export function createTerrainSeed(): TerrainSeed {
  return {
    seedX: Math.random() * Math.PI * 2,
    seedY: Math.random() * Math.PI * 2,
    seedZ: Math.random() * Math.PI * 2,
  };
}

function createTerrainMap(
  simW: number,
  simH: number,
  regions: SandTableRegion[],
  seed: TerrainSeed,
): Float32Array {
  const terrainMap = new Float32Array(simW * simH);
  const heightMap = new Float32Array(simW * simH);

  for (let y = 0; y < simH; y++) {
    for (let x = 0; x < simW; x++) {
      const nx = x * 0.05;
      const ny = y * 0.05;
      const noise =
        Math.sin(nx + seed.seedX) * Math.cos(ny + seed.seedY) +
        0.5 * Math.sin(nx * 2.5 + ny * 1.5 + seed.seedZ);
      const index = y * simW + x;
      const height = (noise + 1.5) / 3.0;
      heightMap[index] = height;
      terrainMap[index] = 1 + Math.pow(height * 2.0, 3);
    }
  }

  for (const region of regions) {
    const rx = Math.floor(region.x * simW);
    const ry = Math.floor(region.y * simH);
    const radius = Math.max(5, Math.floor(Math.min(simW, simH) * 0.15));

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = rx + dx;
        const py = ry + dy;
        if (px < 0 || px >= simW || py < 0 || py >= simH) continue;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) continue;
        const influence = 1 - dist / radius;
        const index = py * simW + px;
        terrainMap[index] =
          terrainMap[index] * (1 - influence * 0.6) +
          region.friction * influence * 0.6;
      }
    }
  }

  return terrainMap;
}

export interface RenderResult {
  needsRedraw: boolean;
  conqueredFaction: { conqueror: string; conquered: string } | null;
}

export function updateFactionPowers(factions: SandTableFaction[]): boolean {
  let needsRedraw = false;
  for (const f of factions) {
    if (f.dead) continue;
    const diff = f.targetPower - f.power;
    if (Math.abs(diff) > 0.002) {
      f.power += diff * 0.08;
      needsRedraw = true;
    }
  }
  return needsRedraw;
}

export function checkConquest(
  factions: SandTableFaction[],
): { conqueror: string; conquered: string } | null {
  for (let idDefend = 0; idDefend < factions.length; idDefend++) {
    const fDefend = factions[idDefend];
    if (fDefend.dead || fDefend.nodes.length === 0) continue;

    const capX = fDefend.nodes[0].x;
    const capY = fDefend.nodes[0].y;
    let minCost = Infinity;
    let conquerorId = -1;

    for (let idAttack = 0; idAttack < factions.length; idAttack++) {
      const fAttack = factions[idAttack];
      if (fAttack.dead) continue;
      let bestCostForAttacker = Infinity;
      for (const node of fAttack.nodes) {
        const dist = Math.hypot(capX - node.x, capY - node.y);
        const cost = (dist * 1.0 + BASE_DEFENSE) / fAttack.power;
        if (cost < bestCostForAttacker) bestCostForAttacker = cost;
      }
      if (bestCostForAttacker < minCost) {
        minCost = bestCostForAttacker;
        conquerorId = idAttack;
      }
    }

    if (conquerorId !== -1 && conquerorId !== idDefend) {
      const conqueror = factions[conquerorId];
      return { conqueror: conqueror.name, conquered: fDefend.name };
    }
  }
  return null;
}

export function renderSandTableToImageData(
  imageData: ImageData,
  simW: number,
  simH: number,
  factions: SandTableFaction[],
  terrainMap: Float32Array,
  isDark: boolean = true,
  seed?: TerrainSeed,
): void {
  const pixels = imageData.data;

  const baseR = isDark ? 210 : 235;
  const baseG = isDark ? 200 : 230;
  const baseB = isDark ? 180 : 220;

  const borderR = isDark ? 40 : 100;
  const borderG = isDark ? 35 : 90;
  const borderB = isDark ? 30 : 80;

  const BORDER_THRESHOLD = 0.935;
  const BORDER_FADE_END = 0.95;

  for (let y = 0; y < simH; y++) {
    for (let x = 0; x < simW; x++) {
      const index = y * simW + x;
      const friction = terrainMap[index];

      let minCost1 = Infinity;
      let minCost2 = Infinity;
      let ownerId = -1;

      for (let i = 0; i < factions.length; i++) {
        const f = factions[i];
        if (f.dead) continue;
        let bestCost = Infinity;
        for (const node of f.nodes) {
          const dist = Math.hypot(x - node.x, y - node.y);
          const cost = (dist * friction + BASE_DEFENSE) / f.power;
          if (cost < bestCost) bestCost = cost;
        }
        if (bestCost < minCost1) {
          minCost2 = minCost1;
          minCost1 = bestCost;
          ownerId = i;
        } else if (bestCost < minCost2) {
          minCost2 = bestCost;
        }
      }

      let r: number, g: number, b: number;
      const nx = x * 0.05;
      const ny = y * 0.05;
      const noise =
        Math.sin(nx + (seed?.seedX ?? 0)) * Math.cos(ny + (seed?.seedY ?? 0)) +
        0.5 * Math.sin(nx * 2.5 + ny * 1.5 + (seed?.seedZ ?? 0));
      const h = (noise + 1.5) / 3.0;
      const shadow = 0.7 + h * 0.4;
      const sR = baseR * shadow;
      const sG = baseG * shadow;
      const sB = baseB * shadow;

      if (minCost1 < 100) {
        const faction = factions[ownerId];
        const ratio = minCost1 / minCost2;

        if (ratio > BORDER_THRESHOLD && minCost2 < 120) {
          const factionR = faction.rgb[0] * 0.7 + sR * 0.3;
          const factionG = faction.rgb[1] * 0.7 + sG * 0.3;
          const factionB = faction.rgb[2] * 0.7 + sB * 0.3;

          if (ratio > BORDER_FADE_END) {
            r = borderR;
            g = borderG;
            b = borderB;
          } else {
            const blend =
              (ratio - BORDER_THRESHOLD) / (BORDER_FADE_END - BORDER_THRESHOLD);
            r = factionR * (1 - blend) + borderR * blend;
            g = factionG * (1 - blend) + borderG * blend;
            b = factionB * (1 - blend) + borderB * blend;
          }
        } else {
          r = faction.rgb[0] * 0.7 + sR * 0.3;
          g = faction.rgb[1] * 0.7 + sG * 0.3;
          b = faction.rgb[2] * 0.7 + sB * 0.3;
        }
      } else {
        r = sR;
        g = sG;
        b = sB;
      }

      const pIndex = index * 4;
      pixels[pIndex] = r;
      pixels[pIndex + 1] = g;
      pixels[pIndex + 2] = b;
      pixels[pIndex + 3] = 255;
    }
  }
}

export function drawFactionLabels(
  ctx: CanvasRenderingContext2D,
  factions: SandTableFaction[],
  scale: number,
  isDark: boolean = true,
): void {
  const strokeStyle = isDark ? "#000" : "#fff";
  const fillStyle = isDark ? "#fff" : "#2c2820";

  for (const f of factions) {
    if (f.dead) continue;
    for (let nodeIdx = 0; nodeIdx < f.nodes.length; nodeIdx++) {
      const node = f.nodes[nodeIdx];
      const realX = node.x * scale;
      const realY = node.y * scale;

      ctx.beginPath();
      if (nodeIdx === 0) {
        ctx.arc(realX, realY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";
        ctx.fill();
        ctx.stroke();

        ctx.font = "bold 16px 'Noto Sans SC', 'Noto Serif SC', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = isDark
          ? "rgba(0, 0, 0, 0.6)"
          : "rgba(255, 255, 255, 0.6)";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.lineWidth = 3;
        ctx.strokeStyle = strokeStyle;
        ctx.strokeText(f.name, realX, realY - 28);

        ctx.fillStyle = fillStyle;
        ctx.fillText(f.name, realX, realY - 28);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else {
        ctx.arc(realX, realY, 4, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${f.rgb.join(",")})`;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#fff";
        ctx.fill();
        ctx.stroke();
      }
    }
  }
}

export function drawDirectionLabels(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  isDark: boolean = true,
): void {
  ctx.font = "600 15px 'Noto Sans SC', 'Noto Serif SC', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = isDark ? "rgba(224, 224, 224, 0.5)" : "rgba(44, 40, 32, 0.4)";

  ctx.fillText("北", width / 2, 14);
  ctx.fillText("南", width / 2, height - 14);
  ctx.save();
  ctx.translate(14, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("西", 0, 0);
  ctx.restore();
  ctx.save();
  ctx.translate(width - 14, height / 2);
  ctx.rotate(Math.PI / 2);
  ctx.fillText("东", 0, 0);
  ctx.restore();
}

export function createSandTableEngine(state: SandTableState) {
  const renderW = 360;
  const renderH = 480;
  const simW = Math.ceil(renderW / SCALE);
  const simH = Math.ceil(renderH / SCALE);

  const seed = createTerrainSeed();
  const terrainMap = createTerrainMap(simW, simH, state.regions, seed);

  const scaledFactions = state.factions.map((f) => ({
    ...f,
    nodes: f.nodes.map((n) => ({
      x: Math.floor(n.x * simW),
      y: Math.floor(n.y * simH),
    })),
  }));

  return {
    renderW,
    renderH,
    simW,
    simH,
    terrainMap,
    factions: scaledFactions,
    scale: SCALE,
    seed,
  };
}

export function applyFactionUpdates(
  factions: SandTableFaction[],
  updates: { name: string; power_delta: number }[],
): SandTableFaction[] {
  return factions.map((f) => {
    const update = updates.find((u) => u.name === f.name);
    if (!update || f.dead) return f;
    let newTarget = f.targetPower + update.power_delta;
    if (newTarget < 0.1) newTarget = 0.1;
    if (newTarget > 6.0) newTarget = 6.0;
    return { ...f, targetPower: newTarget };
  });
}

export function markFactionDead(
  factions: SandTableFaction[],
  factionName: string,
): SandTableFaction[] {
  return factions.map((f) => {
    if (f.name === factionName) {
      return { ...f, dead: true, targetPower: 0.1, power: 0.1 };
    }
    return f;
  });
}
