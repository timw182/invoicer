import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "year";
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let from: Date;
    let to: Date;

    if (fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
    } else if (period === "month") {
      from = startOfMonth(new Date());
      to = endOfMonth(new Date());
    } else {
      from = startOfYear(new Date());
      to = endOfYear(new Date());
    }

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: from, lte: to } },
      select: {
        type: true,
        amount: true,
        taxAmount: true,
        taxRate: true,
        date: true,
      },
    });

    // Group by month
    const monthlyMap = new Map<string, {
      month: string;
      outputVat: number;  // VAT on income (we collected)
      inputVat: number;   // VAT on expenses (we paid)
      incomeNet: number;
      expenseNet: number;
    }>();

    for (const tx of transactions) {
      const key = format(tx.date, "yyyy-MM");
      let entry = monthlyMap.get(key);
      if (!entry) {
        entry = { month: key, outputVat: 0, inputVat: 0, incomeNet: 0, expenseNet: 0 };
        monthlyMap.set(key, entry);
      }

      if (tx.type === "income") {
        entry.outputVat += tx.taxAmount;
        entry.incomeNet += tx.amount - tx.taxAmount;
      } else {
        entry.inputVat += tx.taxAmount;
        entry.expenseNet += tx.amount - tx.taxAmount;
      }
    }

    const monthly = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((m) => ({
        ...m,
        outputVat: Math.round(m.outputVat * 100) / 100,
        inputVat: Math.round(m.inputVat * 100) / 100,
        incomeNet: Math.round(m.incomeNet * 100) / 100,
        expenseNet: Math.round(m.expenseNet * 100) / 100,
        netVat: Math.round((m.outputVat - m.inputVat) * 100) / 100,
      }));

    const totalOutputVat = monthly.reduce((sum, m) => sum + m.outputVat, 0);
    const totalInputVat = monthly.reduce((sum, m) => sum + m.inputVat, 0);
    const netVatLiability = Math.round((totalOutputVat - totalInputVat) * 100) / 100;

    return NextResponse.json({
      from: from.toISOString(),
      to: to.toISOString(),
      totalOutputVat: Math.round(totalOutputVat * 100) / 100,
      totalInputVat: Math.round(totalInputVat * 100) / 100,
      netVatLiability,
      monthly,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to generate tax summary:", e);
    return NextResponse.json({ error: "Failed to generate tax summary" }, { status: 500 });
  }
}
