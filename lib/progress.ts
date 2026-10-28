import {
  emptyPractice,
  readPractice,
  type PracticeData,
} from "./practice-progress";
export type Progress = {
  stars: number;
  completed: Record<string, number>;
  favorites: string[];
  lastActivity: string | null;
  history: { id: string; at: string }[];
  sound: boolean;
  practice: PracticeData;
};
export const emptyProgress: Progress = {
  stars: 0,
  completed: {},
  favorites: [],
  lastActivity: null,
  history: [],
  sound: true,
  practice: structuredClone(emptyPractice),
};
export function readProgress(): Progress {
  try {
    const raw = localStorage.getItem("falabrinca-progress-v3");
    if (!raw) {
      const stars = Number(localStorage.getItem("falabrinca-stars"));
      return {
        ...emptyProgress,
        stars: Number.isSafeInteger(stars) && stars > 0 ? stars : 0,
      };
    }
    const p = JSON.parse(raw);
    return {
      stars: Number.isSafeInteger(p.stars) && p.stars >= 0 ? p.stars : 0,
      completed:
        p.completed && typeof p.completed === "object"
          ? Object.fromEntries(
              Object.entries(p.completed as Record<string, unknown>).filter(
                (entry): entry is [string, number] => {
                  const [key, value] = entry;
                  return (
                    typeof key === "string" &&
                    typeof value === "number" &&
                    Number.isSafeInteger(value) &&
                    value > 0
                  );
                },
              ),
            )
          : {},
      favorites: Array.isArray(p.favorites)
        ? p.favorites.filter((id: unknown) => typeof id === "string")
        : [],
      lastActivity: typeof p.lastActivity === "string" ? p.lastActivity : null,
      history: Array.isArray(p.history)
        ? p.history
            .filter(
              (h: { id?: unknown; at?: unknown }) =>
                h &&
                typeof h.id === "string" &&
                typeof h.at === "string" &&
                Number.isFinite(Date.parse(h.at)),
            )
            .slice(0, 30)
        : [],
      sound: p.sound !== false,
      practice: readPractice(p.practice),
    };
  } catch {
    return { ...emptyProgress };
  }
}
