import { NextResponse } from "next/server";
import { requireMaster } from "../../../../lib/access";
import { failure, HttpError } from "../../../../lib/server";
import { configuredPriceIds } from "../../../../lib/billing";
export async function GET(request: Request) {
  try {
    const { user, db } = await requireMaster(request);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const search = url.searchParams.get("search") ?? "";
    const filter = url.searchParams.get("filter") ?? "all";
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > 100000 ||
      search.length > 100 ||
      ![
        "all",
        "no_purchase",
        "logged_no_purchase",
        "active",
        "inactive",
      ].includes(filter)
    )
      throw new HttpError(400, "Confira os filtros de consulta.");
    const prices = configuredPriceIds();
    const { data, error } = await db.rpc("master_customer_dashboard", {
      p_master: user.id,
      p_monthly: prices.monthly ?? "",
      p_annual: prices.annual ?? "",
      p_page: page,
      p_search: search,
      p_filter: filter,
    });
    if (error || !data)
      throw new HttpError(
        503,
        "Execute a atualização comercial do banco para abrir este painel.",
      );
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}
