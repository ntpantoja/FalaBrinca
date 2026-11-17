import { PLANS } from "./plan";
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
  const gross =
    (counts[0] * PLANS.monthly.amount +
      counts[1] * PLANS.annual.amount +
      counts[2] * PLANS.yearly_pass.amount) /
    100;
  const mrr =
    (counts[0] * PLANS.monthly.amount +
      (counts[1] * PLANS.annual.amount) / 12) /
    100;
  const passEquivalent = (counts[2] * PLANS.yearly_pass.amount) / 1200;
  const costs =
    clean(fixed) +
    (gross * Math.min(100, clean(feesPercent))) / 100 +
    counts.reduce((a, b) => a + b, 0) * clean(costPerAccount);
  return { gross, mrr, passEquivalent, costs, estimatedBalance: gross - costs };
}
