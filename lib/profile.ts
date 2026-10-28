export type FamilyProfile = {
  guardian_name: string;
  child_first_name: string;
  consent_version: string;
};
export const CONSENT_VERSION = "2026-10-28";
export function parseProfile(input: unknown): FamilyProfile | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Record<string, unknown>;
  const guardian =
    typeof data.guardian_name === "string"
      ? data.guardian_name.trim().replace(/\s+/g, " ")
      : "";
  const child =
    typeof data.child_first_name === "string"
      ? data.child_first_name.trim().replace(/\s+/g, " ")
      : "";
  const valid = (name: string, max: number) =>
    name.length >= 2 && name.length <= max && /^[\p{L}\p{M} '\-]+$/u.test(name);
  if (!valid(guardian, 80) || !valid(child, 40) || data.consent !== true)
    return null;
  return {
    guardian_name: guardian,
    child_first_name: child,
    consent_version: CONSENT_VERSION,
  };
}
