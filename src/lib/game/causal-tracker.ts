import type { CausalNode, CharacterRelation } from "@/types";

export function createCausalNode(
  turnIndex: number,
  year: number,
  decision: string,
  consequence: string,
  parentIds: string[] = [],
): CausalNode {
  return {
    id: `causal_${turnIndex}_${Date.now()}`,
    turnIndex,
    year,
    decision,
    consequence,
    parentIds,
    childIds: [],
  };
}

export function linkCausalNodes(
  nodes: CausalNode[],
  parentId: string,
  childId: string,
): CausalNode[] {
  return nodes.map((node) => {
    if (node.id === parentId && !node.childIds.includes(childId)) {
      return { ...node, childIds: [...node.childIds, childId] };
    }
    if (node.id === childId && !node.parentIds.includes(parentId)) {
      return { ...node, parentIds: [...node.parentIds, parentId] };
    }
    return node;
  });
}

export function getCausalChain(
  nodes: CausalNode[],
  startId: string,
): CausalNode[] {
  const chain: CausalNode[] = [];
  const visited = new Set<string>();
  const queue = [startId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const node = nodes.find((n) => n.id === currentId);
    if (node) {
      chain.push(node);
      for (const childId of node.childIds) {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return chain;
}

export function updateCharacterRelations(
  existingRelations: CharacterRelation[],
): CharacterRelation[] {
  const updated = [...existingRelations];
  return updated;
}
