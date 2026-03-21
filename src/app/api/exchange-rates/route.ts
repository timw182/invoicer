import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getExchangeRate, getAllRates } from "@/lib/exchange-rates";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const base = searchParams.get("base");

    // Single rate: /api/exchange-rates?from=USD&to=EUR
    if (from && to) {
      const rate = await getExchangeRate(from, to);
      if (rate === null) {
        return NextResponse.json({ error: `Rate not available for ${from}/${to}` }, { status: 404 });
      }
      return NextResponse.json({ from, to, rate });
    }

    // All rates against base: /api/exchange-rates?base=EUR
    const rates = await getAllRates(base || "EUR");
    return NextResponse.json({ base: base || "EUR", rates });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 500 });
  }
}
