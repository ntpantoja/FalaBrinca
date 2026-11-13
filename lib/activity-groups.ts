import type { ActivityKind } from "./catalog";
export const activityGroups = {
  learning: "Figuras e linguagem",
  puzzle: "Quebra-cabeças",
  memory: "Jogos de memória",
} as const;
export type ActivityGroup = keyof typeof activityGroups;
export function activityGroup(kind: ActivityKind): ActivityGroup {
  return kind === "puzzle" || kind === "memory" ? kind : "learning";
}
