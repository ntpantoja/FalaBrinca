export type DailyUsage = Record<
  string,
  { milliseconds: number; activities: number }
>;
export function practiceDay(time = Date.now()) {
  return new Date(time).toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}
export function creditPractice(
  usage: DailyUsage,
  end: number,
  milliseconds: number,
  completed = false,
): DailyUsage {
  const next = { ...usage };
  let start =
    end - Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0);
  while (start < end) {
    const day = practiceDay(start);
    let boundary = end;
    if (practiceDay(end - 1) !== day) {
      let low = start,
        high = end;
      while (high - low > 1) {
        const mid = Math.floor((low + high) / 2);
        if (practiceDay(mid) === day) low = mid;
        else high = mid;
      }
      boundary = high;
    }
    const previous = next[day] ?? { milliseconds: 0, activities: 0 };
    next[day] = {
      ...previous,
      milliseconds: previous.milliseconds + boundary - start,
    };
    start = boundary;
  }
  if (completed) {
    const day = practiceDay(end);
    const previous = next[day] ?? { milliseconds: 0, activities: 0 };
    next[day] = { ...previous, activities: previous.activities + 1 };
  }
  return Object.fromEntries(
    Object.entries(next)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 30),
  );
}
