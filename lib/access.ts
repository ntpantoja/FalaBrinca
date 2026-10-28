import "server-only";
import { customerId, HttpError, requireUser, stripeClient } from "./server";
import { subscriptionFor } from "./billing";
export function isMasterUser(userId: string) {
  const configured = process.env.MASTER_USER_ID?.trim();
  return !!configured && configured === userId;
}
export async function requireMaster(request: Request) {
  const context = await requireUser(request);
  if (!process.env.MASTER_USER_ID)
    throw new HttpError(
      503,
      "O acesso master ainda precisa ser vinculado à conta do proprietário.",
    );
  if (!isMasterUser(context.user.id))
    throw new HttpError(403, "Essa área é exclusiva do administrador master.");
  return { ...context, role: "master" as const };
}
export async function requireMember(request: Request) {
  const context = await requireUser(request);
  if (isMasterUser(context.user.id))
    return { ...context, role: "master" as const };
  const customer = await customerId(context.db, context.user.id);
  if (!customer || !(await subscriptionFor(stripeClient(), customer)).active)
    throw new HttpError(
      403,
      "Escolha o plano mensal para acessar as atividades.",
    );
  return { ...context, role: "subscriber" as const };
}
