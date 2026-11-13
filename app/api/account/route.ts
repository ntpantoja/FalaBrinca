import {
  billingTestSetup,
  testCheckoutEnabledFor,
} from "../../../lib/billing-test";
import { NextResponse } from "next/server";
import {
  customerId,
  failure,
  HttpError,
  requireUser,
  stripeClient,
} from "../../../lib/server";
import { activePass, subscriptionFor } from "../../../lib/billing";
import { isMasterUser } from "../../../lib/access";
export async function GET(request: Request) {
  try {
    const { user, db } = await requireUser(request);
    const testCheckoutEnabled = testCheckoutEnabledFor(user.id);
    if (isMasterUser(user.id)) {
      let customer: string | undefined;
      let testBilling: Awaited<ReturnType<typeof subscriptionFor>> | undefined;
      let testBillingUnavailable = false;
      try {
        if (process.env.STRIPE_TEST_PRICE_ID?.trim())
          customer = await customerId(db, user.id);
        if (customer)
          testBilling = await subscriptionFor(stripeClient(), customer);
      } catch {
        testBillingUnavailable = true;
      }
      const ongoing =
        !!testBilling?.subscription &&
        !["canceled", "incomplete_expired"].includes(
          testBilling.subscription.status,
        );
      return NextResponse.json(
        {
          email: user.email,
          active: true,
          status: "master",
          canManage: !!customer,
          isMaster: true,
          testCheckoutEnabled,
          testCheckoutSetup: billingTestSetup(user.id),
          canTestPurchase:
            testCheckoutEnabled && !ongoing && !testBillingUnavailable,
          testBillingUnavailable,
          testSubscriptionStatus: testBilling?.isTestSubscription
            ? testBilling.subscription?.status
            : null,
          testCancelAtPeriodEnd: testBilling?.isTestSubscription
            ? testBilling.subscription?.cancel_at_period_end
            : false,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const visit = await db.rpc("record_account_visit", {
      p_user_id: user.id,
      p_login_at: user.last_sign_in_at ?? null,
    });
    if (visit.error)
      throw new HttpError(
        503,
        "Execute a atualização comercial do banco para consultar sua conta.",
      );
    const customer = await customerId(db, user.id);
    const pass = await activePass(db, user.id);
    if (pass)
      return NextResponse.json(
        {
          email: user.email,
          active: true,
          status: "active",
          plan: "yearly_pass",
          canManage: !!customer,
          periodEnd: pass.ends_at,
          cancelAtPeriodEnd: false,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    if (!customer)
      return NextResponse.json(
        {
          email: user.email,
          active: false,
          status: "none",
          canManage: false,
          testCheckoutEnabled,
          canTestPurchase: testCheckoutEnabled,
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    const { subscription, active, plan, isTestSubscription } =
      await subscriptionFor(stripeClient(), customer);
    const periodEnd = subscription?.items.data[0]?.current_period_end;
    return NextResponse.json(
      {
        email: user.email,
        active,
        plan,
        isTestSubscription,
        testCheckoutEnabled,
        canTestPurchase:
          testCheckoutEnabled &&
          (!subscription ||
            ["canceled", "incomplete_expired"].includes(subscription.status)),
        testSubscriptionStatus: isTestSubscription
          ? subscription?.status
          : null,
        testCancelAtPeriodEnd: isTestSubscription
          ? subscription?.cancel_at_period_end
          : false,
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
