import { NextResponse } from "next/server";
import {
  appUrl,
  customerId,
  failure,
  HttpError,
  requireOrigin,
  requireUser,
  stripeClient,
} from "../../../lib/server";
export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const { user, db } = await requireUser(request);
    const customer = await customerId(db, user.id);
    if (!customer)
      throw new HttpError(404, "Esta conta ainda não possui uma assinatura.");
    const session = await stripeClient().billingPortal.sessions.create({
      customer,
      return_url: `${appUrl()}/conta`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    return failure(error);
  }
}
