import type { Category } from "./content-validation";
export type SelectionAttempt = { at: string; correct: boolean; word: string };
export type PracticedWord = {
  word: string;
  emoji: string;
  category: Category;
  at: string;
};
export type PracticeSession = {
  id: string;
  activityId: string;
  startedAt: string;
  milliseconds: number;
};
export type RewardGoal = {
  id: string;
  title: string;
  target: number;
  baseline: number;
  createdAt: string;
  redeemedAt?: string;
};
export type PracticeData = {
  attempts: SelectionAttempt[];
  words: Record<string, PracticedWord>;
  sessions: PracticeSession[];
  goals: RewardGoal[];
  volume: number;
  rate: number;
  showLabels: boolean;
};
export const emptyPractice: PracticeData = {
  attempts: [],
  words: {},
  sessions: [],
  goals: [],
  volume: 1,
  rate: 0.8,
  showLabels: false,
};
export function wordKey(word: string) {
  return word.trim().normalize("NFC").toLocaleLowerCase("pt-BR");
}
export function selectionSummary(attempts: SelectionAttempt[]) {
  const correct = attempts.filter((a) => a.correct).length;
  return {
    correct,
    total: attempts.length,
    percent: attempts.length
      ? Math.round((correct / attempts.length) * 100)
      : 0,
  };
}
export function weeklyCounts(
  words: Record<string, PracticedWord>,
  now = new Date(),
) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 86400000);
    const key = formatter.format(date);
    return {
      label: date
        .toLocaleDateString("pt-BR", {
          weekday: "short",
          timeZone: "America/Sao_Paulo",
        })
        .replace(".", ""),
      key,
      count: Object.values(words).filter(
        (w) => formatter.format(new Date(w.at)) === key,
      ).length,
    };
  });
}
export function canRedeem(goal: RewardGoal, stars: number) {
  return !goal.redeemedAt && stars - goal.baseline >= goal.target;
}
export function readPractice(input: unknown): PracticeData {
  if (!input || typeof input !== "object")
    return structuredClone(emptyPractice);
  const p = input as Record<string, unknown>;
  const validDate = (v: unknown): v is string =>
    typeof v === "string" && Number.isFinite(Date.parse(v));
  return {
    attempts: Array.isArray(p.attempts)
      ? p.attempts
          .filter(
            (a) =>
              a &&
              typeof a.correct === "boolean" &&
              typeof a.word === "string" &&
              validDate(a.at),
          )
          .slice(-2000)
      : [],
    words:
      p.words && typeof p.words === "object"
        ? Object.fromEntries(
            Object.entries(p.words).filter(
              ([, w]) =>
                w &&
                typeof w === "object" &&
                typeof (w as PracticedWord).word === "string" &&
                typeof (w as PracticedWord).emoji === "string" &&
                validDate((w as PracticedWord).at),
            ),
          )
        : {},
    sessions: Array.isArray(p.sessions)
      ? p.sessions
          .filter(
            (s) =>
              s &&
              typeof s.id === "string" &&
              typeof s.activityId === "string" &&
              typeof s.milliseconds === "number" &&
              s.milliseconds >= 0 &&
              s.milliseconds <= 86400000 &&
              validDate(s.startedAt),
          )
          .slice(-300)
      : [],
    goals: Array.isArray(p.goals)
      ? p.goals
          .filter(
            (g) =>
              g &&
              typeof g.id === "string" &&
              typeof g.title === "string" &&
              g.title.length <= 80 &&
              Number.isInteger(g.target) &&
              g.target > 0 &&
              typeof g.baseline === "number" &&
              validDate(g.createdAt),
          )
          .slice(0, 20)
      : [],
    volume:
      typeof p.volume === "number" && p.volume >= 0 && p.volume <= 1
        ? p.volume
        : 1,
    rate:
      typeof p.rate === "number" && p.rate >= 0.5 && p.rate <= 1.2
        ? p.rate
        : 0.8,
    showLabels: p.showLabels === true,
  };
}
