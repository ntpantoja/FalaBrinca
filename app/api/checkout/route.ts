import { NextResponse } from 'next/server';
import Stripe from 'stripe';
export async function POST(request: Request) {
 const base = process.env.APP_URL;
 const secret = process.env.STRIPE_SECRET_KEY;
 const price = process.env.STRIPE_PRICE_ID;
 if (!base || !secret || !price) return NextResponse.json({ error: 'Assinaturas ainda não disponíveis. Nenhuma cobrança foi realizada.' }, { status: 503 });
 if (request.headers.get('origin') !== new URL(base).origin) return NextResponse.json({ error: 'Origem não permitida.' }, { status: 403 });
 try {
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{ price, quantity: 1 }], success_url: `${base}/?checkout=success`, cancel_url: `${base}/?checkout=cancelled`, locale: 'pt-BR' });
  return NextResponse.json({ url: session.url });
 } catch { return NextResponse.json({ error: 'Não foi possível abrir o pagamento. Tente novamente mais tarde.' }, { status: 502 }); }
}
