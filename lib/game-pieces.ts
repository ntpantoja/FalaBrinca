export function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function placePuzzlePiece(
  slots: readonly (number | null)[],
  piece: number,
  slot: number,
) {
  if (
    !Number.isInteger(piece) ||
    !Number.isInteger(slot) ||
    piece < 0 ||
    piece > 3 ||
    slot < 0 ||
    slot > 3 ||
    slots.length !== 4 ||
    piece !== slot ||
    slots[slot] !== null ||
    slots.includes(piece)
  )
    return null;
  return slots.map((old, index) => (index === slot ? piece : old));
}
