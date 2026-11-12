export function estimateSales(
  monthly: number,
  annual: number,
  passes: number,
  fixed: number,
  feesPercent: number,
  costPerAccount: number,
) {
  const counts = [monthly, annual, passes].map((n) =>
    Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0,
  );
  const clean = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);
  const gross = counts[0] * 50 + counts[1] * 450 + counts[2] * 500;
  const mrr = counts[0] * 50 + (counts[1] * 450) / 12;
  const passEquivalent = (counts[2] * 500) / 12;
  const costs =
    clean(fixed) +
    (gross * Math.min(100, clean(feesPercent))) / 100 +
    counts.reduce((a, b) => a + b, 0) * clean(costPerAccount);
  return { gross, mrr, passEquivalent, costs, estimatedBalance: gross - costs };
}
