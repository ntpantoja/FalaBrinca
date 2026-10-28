import { NextResponse } from "next/server";
import {
  customerId,
  failure,
  requireUser,
  stripeClient,
} from "../../../lib/server";
import { subscriptionFor } from "../../../lib/billing";
import { isMasterUser } from "../../../lib/access";
export async function GET(request: Request) {
  try {
    const { user, db } = await requireUser(request);
    if (isMasterUser(user.id))
      return NextResponse.json(
        {
          email: user.email,
          active: true,
          status: "master",
          canManage: false,
          isMaster: true,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const customer = await customerId(db, user.id);
    if (!customer)
      return NextResponse.json(
        { email: user.email, active: false, status: "none", canManage: false },
        { headers: { "Cache-Control": "no-store" } },
      );
    const { subscription, active } = await subscriptionFor(
      stripeClient(),
      customer,
    );
    const periodEnd = subscription?.items.data[0]?.current_period_end;
    return NextResponse.json(
      {
        email: user.email,
        active,
        status: subscription?.status ?? "none",
        canManage: true,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
        periodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
