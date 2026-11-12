import "server-only";
import { createHash } from "node:crypto";
import { HttpError, type adminDb } from "./server";
export const DEVICE_COOKIE = "falabrinca-device";
export function deviceToken(request: Request) {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${DEVICE_COOKIE}=`))
    ?.slice(DEVICE_COOKIE.length + 1);
  return raw && /^[a-f0-9]{64}$/.test(raw) ? raw : undefined;
}
export function deviceHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function deviceLabel(agent: string) {
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Firefox\//.test(agent)
      ? "Firefox"
      : /Chrome\//.test(agent)
        ? "Chrome"
        : /Safari\//.test(agent)
          ? "Safari"
          : "Navegador";
  const system = /iPad/.test(agent)
    ? "iPad"
    : /iPhone/.test(agent)
      ? "iPhone"
      : /Android/.test(agent)
        ? "Android"
        : /Windows/.test(agent)
          ? "Windows"
          : /Macintosh/.test(agent)
            ? "Mac"
            : /Linux/.test(agent)
              ? "Linux"
              : "aparelho";
  return `${browser} · ${system}`;
}
export async function requireDevice(
  request: Request,
  db: ReturnType<typeof adminDb>,
  userId: string,
) {
  const token = deviceToken(request);
  if (!token)
    throw new HttpError(
      428,
      "Cadastre este dispositivo para acessar as atividades.",
    );
  const { data, error } = await db
    .from("account_devices")
    .select("revoked")
    .eq("user_id", userId)
    .eq("token_hash", deviceHash(token))
    .maybeSingle();
  if (error)
    throw new HttpError(
      503,
      "Não foi possível verificar os dispositivos. Confira a atualização do banco.",
    );
  if (!data || data.revoked)
    throw new HttpError(
      428,
      "Este dispositivo foi desconectado. Gerencie seus dispositivos para continuar.",
    );
}
