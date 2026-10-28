import "server-only";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { NextResponse } from "next/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error("Falha em operação de conta ou assinatura.");
  return NextResponse.json(
    {
      error: "Não foi possível concluir. Tente novamente em alguns instantes.",
    },
    { status: 502 },
  );
}
export function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError(
      503,
      "Cadastro e assinaturas estão sendo preparados. Tente novamente mais tarde.",
    );
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function requireUser(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, "Entre na sua conta para continuar.");
  const db = adminDb();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user)
    throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  if (!data.user.email_confirmed_at)
    throw new HttpError(403, "Confirme seu e-mail antes de assinar.");
  return { user: data.user, db };
}
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new HttpError(
      503,
      "Pagamentos ainda não disponíveis. Nenhuma cobrança foi realizada.",
    );
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
}
export function appUrl() {
  if (!process.env.APP_URL)
    throw new HttpError(
      503,
      "A configuração do aplicativo ainda não foi concluída.",
    );
  const url = new URL(process.env.APP_URL);
  if (url.protocol !== "https:" && url.hostname !== "localhost")
    throw new HttpError(503, "O endereço do aplicativo precisa usar HTTPS.");
  return url.origin;
}
export function requireOrigin(request: Request) {
  if (request.headers.get("origin") !== appUrl())
    throw new HttpError(403, "Origem não permitida.");
}
export async function customerId(
  db: ReturnType<typeof adminDb>,
  userId: string,
) {
  const { data, error } = await db
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new HttpError(
      503,
      "O cadastro de assinaturas ainda não está disponível.",
    );
  return data?.stripe_customer_id as string | undefined;
}
