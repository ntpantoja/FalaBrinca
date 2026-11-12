"use client";
import type { Session } from "@supabase/supabase-js";
import { browserAuth } from "./supabase-browser";
import { temporaryAuthFailure } from "./auth-errors";
export class SessionExpiredError extends Error {
  constructor() {
    super("Entre na sua conta para continuar.");
  }
}
export class SessionConnectionError extends Error {
  constructor() {
    super(
      "Não foi possível reconectar agora. Confira sua conexão e tente novamente.",
    );
  }
}
let renewing: Promise<Session | null> | undefined;
export async function refreshBrowserSession(): Promise<Session | null> {
  const auth = browserAuth();
  if (!auth) return null;
  if (!renewing) {
    renewing = (async () => {
      try {
        const { data, error } = await auth.auth.refreshSession();
        if (error) {
          if (temporaryAuthFailure(error)) throw new SessionConnectionError();
          return null;
        }
        return data.session;
      } catch (error) {
        if (error instanceof SessionConnectionError) throw error;
        throw new SessionConnectionError();
      }
    })();
  }
  try {
    return await renewing;
  } finally {
    renewing = undefined;
  }
}
export async function sessionForRequest() {
  const auth = browserAuth();
  if (!auth) return null;
  let result;
  try {
    result = await auth.auth.getSession();
  } catch {
    throw new SessionConnectionError();
  }
  if (result.error) {
    if (temporaryAuthFailure(result.error)) throw new SessionConnectionError();
    return null;
  }
  const session = result.data.session;
  if (session?.expires_at && session.expires_at * 1000 <= Date.now() + 60000)
    return refreshBrowserSession();
  return session;
}
export async function authenticatedFetch(
  path: string,
  options: RequestInit = {},
) {
  if (!path.startsWith("/api/"))
    throw new Error("Endereço de acesso inválido.");
  const session = await sessionForRequest();
  if (!session) throw new SessionExpiredError();
  const send = async (accessToken: string) => {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    try {
      return await fetch(path, { ...options, headers, cache: "no-store" });
    } catch {
      throw new SessionConnectionError();
    }
  };
  const response = await send(session.access_token);
  if (response.status !== 401) return response;
  const renewed = await refreshBrowserSession();
  if (!renewed) throw new SessionExpiredError();
  return send(renewed.access_token);
}
