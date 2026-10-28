import { NextResponse } from "next/server";
import {
  customerId,
  failure,
  HttpError,
  requireUser,
  stripeClient,
} from "../../../../lib/server";
import { subscriptionFor } from "../../../../lib/billing";
export async function GET(request: Request) {
  try {
    const { user, db } = await requireUser(request);
    const customer = await customerId(db, user.id);
    if (!customer || !(await subscriptionFor(stripeClient(), customer)).active)
      throw new HttpError(
        403,
        "Esta aventura faz parte do plano mensal. Conheça a assinatura na área dos adultos.",
      );
    return NextResponse.json(
      {
        rounds: [
          {
            word: "BANANA",
            emoji: "🍌",
            hint: "Uma fruta amarela!",
            choices: [
              { name: "UVA", emoji: "🍇" },
              { name: "BANANA", emoji: "🍌" },
              { name: "CARRO", emoji: "🚗" },
            ],
          },
          {
            word: "CACHORRO",
            emoji: "🐶",
            hint: "Quem faz au-au?",
            choices: [
              { name: "CACHORRO", emoji: "🐶" },
              { name: "GATO", emoji: "🐱" },
              { name: "PEIXE", emoji: "🐟" },
            ],
          },
          {
            word: "CARRO",
            emoji: "🚗",
            hint: "Tem rodas e faz vrum!",
            choices: [
              { name: "SOL", emoji: "☀️" },
              { name: "BOLA", emoji: "⚽" },
              { name: "CARRO", emoji: "🚗" },
            ],
          },
          {
            word: "SOL",
            emoji: "☀️",
            hint: "Ilumina o nosso dia!",
            choices: [
              { name: "LUA", emoji: "🌙" },
              { name: "SOL", emoji: "☀️" },
              { name: "FLOR", emoji: "🌼" },
            ],
          },
          {
            word: "PEIXE",
            emoji: "🐟",
            hint: "Ele vive na água!",
            choices: [
              { name: "PEIXE", emoji: "🐟" },
              { name: "GATO", emoji: "🐱" },
              { name: "PATO", emoji: "🦆" },
            ],
          },
          {
            word: "FLOR",
            emoji: "🌼",
            hint: "Pode crescer no jardim!",
            choices: [
              { name: "BOLA", emoji: "⚽" },
              { name: "MAÇÃ", emoji: "🍎" },
              { name: "FLOR", emoji: "🌼" },
            ],
          },
        ],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
