import type { ActivityContent, Adventure, Choice, Round } from "./catalog";
export const categories = {
  animals: "Animais",
  objects: "Objetos",
  foods: "Alimentos",
} as const;
export const difficulties = {
  beginner: "Inicial · ouvir e repetir",
  intermediate: "Intermediário · associar",
  advanced: "Avançado · histórias visuais",
} as const;
export type Category = keyof typeof categories;
export type Difficulty = keyof typeof difficulties;
export type ManagedActivity = Adventure & {
  category: Category;
  difficulty: Difficulty;
  published: boolean;
  revision: number;
  content: ActivityContent;
};
export function safeMediaUrl(value: unknown) {
  if (value === undefined || value === "") return true;
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
const text = (v: unknown, min: number, max: number): v is string =>
  typeof v === "string" &&
  v.trim().length >= min &&
  v.length <= max &&
  !/[\u0000-\u001f<>]/.test(v);
const drawing = (value: unknown, max = 16) =>
  text(value, 1, max) && !/[\p{L}\p{N}]/u.test(value);
function choice(v: unknown): v is Choice {
  if (!v || typeof v !== "object") return false;
  const c = v as Choice;
  return text(c.name, 1, 60) && drawing(c.emoji) && safeMediaUrl(c.image_url);
}
export function validateActivity(input: unknown): ManagedActivity | null {
  if (!input || typeof input !== "object") return null;
  const a = input as ManagedActivity;
  if (
    !text(a.id, 3, 64) ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(a.id) ||
    !text(a.title, 3, 80) ||
    !text(a.description, 3, 240) ||
    !drawing(a.emoji) ||
    !["mint", "peach", "lavender", "sky", "butter"].includes(a.color) ||
    !Object.hasOwn(categories, a.category) ||
    !Object.hasOwn(difficulties, a.difficulty) ||
    typeof a.published !== "boolean"
  )
    return null;
  const kind =
    a.difficulty === "beginner"
      ? "figures"
      : a.difficulty === "intermediate"
        ? "association"
        : "sentence";
  if (a.kind !== kind) return null;
  if (
    !a.content ||
    !Array.isArray(a.content.rounds) ||
    a.content.rounds.length < 1 ||
    a.content.rounds.length > 12
  )
    return null;
  const rounds: Round[] = [];
  for (const r of a.content.rounds) {
    if (!r || typeof r !== "object") return null;
    if (
      !text(r.prompt, 2, 240) ||
      !text(r.answer, 1, 240) ||
      typeof r.hint !== "string" ||
      r.hint.length > 240 ||
      (r.scene && !drawing(r.scene, 60))
    )
      return null;
    if (kind === "sentence") {
      const sequence = r.sequence;
      if (
        !Array.isArray(sequence) ||
        sequence.length < 2 ||
        sequence.length > 5 ||
        !sequence.every(choice) ||
        new Set(sequence.map((c) => c.name.trim())).size !== sequence.length ||
        new Set(sequence.map((c) => c.image_url || c.emoji)).size !==
          sequence.length
      )
        return null;
      rounds.push({
        prompt: r.prompt.trim(),
        answer: r.answer.trim(),
        hint: r.hint.trim(),
        scene: r.scene,
        choices: [],
        sequence: sequence.map((c) => ({
          name: c.name.trim(),
          emoji: c.emoji,
          image_url: c.image_url || undefined,
        })),
      });
    } else {
      if (
        !Array.isArray(r.choices) ||
        r.choices.length !== 3 ||
        !r.choices.every(choice) ||
        new Set(r.choices.map((c) => c.name.trim())).size !== 3 ||
        new Set(r.choices.map((c) => c.image_url || c.emoji)).size !== 3 ||
        r.choices.filter((c) => c.name === r.answer).length !== 1
      )
        return null;
      rounds.push({
        prompt: r.prompt.trim(),
        answer: r.answer.trim(),
        hint: r.hint.trim(),
        scene: r.scene,
        choices: r.choices.map((c) => ({
          name: c.name.trim(),
          emoji: c.emoji,
          image_url: c.image_url || undefined,
        })),
      });
    }
  }
  return {
    id: a.id,
    title: a.title.trim(),
    description: a.description.trim(),
    emoji: a.emoji,
    color: a.color,
    kind,
    category: a.category,
    difficulty: a.difficulty,
    published: a.published,
    revision: Number.isInteger(a.revision) && a.revision > 0 ? a.revision : 1,
    minutes: Math.max(1, Math.ceil(rounds.length)),
    content: { id: a.id, rounds },
  };
}
