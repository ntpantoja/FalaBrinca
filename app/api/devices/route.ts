import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  requireOrigin,
  requireUser,
  failure,
  HttpError,
  appUrl,
} from "../../../lib/server";
import {
  deviceToken,
  deviceHash,
  deviceLabel,
  DEVICE_COOKIE,
} from "../../../lib/devices";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  try {
    const { db, user } = await requireUser(request);
    const token = deviceToken(request);
    const { data, error } = await db
      .from("account_devices")
      .select("token_hash,label,created_at,last_seen_at")
      .eq("user_id", user.id)
      .eq("revoked", false)
      .order("created_at");
    if (error)
      throw new HttpError(
        503,
        "Atualize o banco para gerenciar os dispositivos.",
      );
    return NextResponse.json(
      {
        devices: (data ?? []).map((d) => ({
          id: d.token_hash,
          label: d.label,
          createdAt: d.created_at,
          lastSeen: d.last_seen_at,
          current: !!token && d.token_hash === deviceHash(token),
        })),
        limit: 3,
      },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const { db, user } = await requireUser(request);
    const visit = await db.rpc("record_account_visit", {
      p_user_id: user.id,
      p_login_at: user.last_sign_in_at ?? null,
    });
    if (visit.error)
      throw new HttpError(
        503,
        "Não foi possível atualizar o registro de acesso. Confira a atualização do banco.",
      );
    const token = deviceToken(request) ?? randomBytes(32).toString("hex");
    let { data, error } = await db.rpc("register_account_device", {
      p_user_id: user.id,
      p_token_hash: deviceHash(token),
      p_label: deviceLabel(request.headers.get("user-agent") ?? ""),
    });
    if (
      !error &&
      data === "revoked" &&
      new URL(request.url).searchParams.get("reactivate") === "1"
    ) {
      const replacement = randomBytes(32).toString("hex");
      const result = await db.rpc("register_account_device", {
        p_user_id: user.id,
        p_token_hash: deviceHash(replacement),
        p_label: deviceLabel(request.headers.get("user-agent") ?? ""),
      });
      if (result.error)
        throw new HttpError(503, "Não foi possível ativar este dispositivo.");
      if (result.data !== "ok")
        throw new HttpError(
          409,
          "Desconecte um dispositivo para liberar uma vaga.",
        );
      const response = NextResponse.json({ registered: true }, { headers });
      response.cookies.set(DEVICE_COOKIE, replacement, {
        httpOnly: true,
        secure: appUrl().startsWith("https:"),
        sameSite: "lax",
        path: "/",
        maxAge: 31536000,
      });
      return response;
    }
    if (error)
      throw new HttpError(
        503,
        "Atualize o banco para ativar o limite de dispositivos.",
      );
    if (data !== "ok")
      throw new HttpError(
        409,
        data === "revoked"
          ? "Este dispositivo foi desconectado. Libere uma vaga e ative-o novamente na lista de dispositivos."
          : "Sua conta já tem três dispositivos. Desconecte um para usar este aparelho.",
      );
    const response = NextResponse.json({ registered: true }, { headers });
    response.cookies.set(DEVICE_COOKIE, token, {
      httpOnly: true,
      secure: appUrl().startsWith("https:"),
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    requireOrigin(request);
    const { db, user } = await requireUser(request);
    const input = await request.json();
    if (typeof input.id !== "string" || !/^[a-f0-9]{64}$/.test(input.id))
      throw new HttpError(400, "Escolha o dispositivo a desconectar.");
    const { error } = await db
      .from("account_devices")
      .update({ revoked: true })
      .eq("user_id", user.id)
      .eq("token_hash", input.id);
    if (error)
      throw new HttpError(503, "Não foi possível desconectar o dispositivo.");
    const response = NextResponse.json({ disconnected: true }, { headers });
    const token = deviceToken(request);
    if (token && deviceHash(token) === input.id)
      response.cookies.delete(DEVICE_COOKIE);
    return response;
  } catch (error) {
    return failure(error);
  }
}
