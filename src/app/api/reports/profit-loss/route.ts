import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // month, quarter, year, custom
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let from: Date;
    let to: Date;

    if (fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
    } else if (period === "year") {
      from = startOfYear(new Date());
      to = endOfYear(new Date());
    } else {
      from = startOfMonth(new Date());
      to = endOfMonth(new Date());
    }

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true },
    });

    // Group by category
    const incomeByCategory = new Map<string, { name: string; color: string | null; total: number }>();
    const expenseByCategory = new Map<string, { name: string; color: string | null; total: number }>();

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      const catName = tx.category?.name || "Uncategorized";
      const catColor = tx.category?.color || null;
      const catId = tx.categoryId || "uncategorized";

      if (tx.type === "income") {
        totalIncome += tx.amount;
        const existing = incomeByCategory.get(catId);
        if (existing) {
          existing.total += tx.amount;
        } else {
          incomeByCategory.set(catId, { name: catName, color: catColor, total: tx.amount });
        }
      } else {
        totalExpenses += tx.amount;
        const existing = expenseByCategory.get(catId);
        if (existing) {
          existing.total += tx.amount;
        } else {
          expenseByCategory.set(catId, { name: catName, color: catColor, total: tx.amount });
        }
      }
    }

    const netProfit = Math.round((totalIncome - totalExpenses) * 100) / 100;

    return NextResponse.json({
      from: from.toISOString(),
      to: to.toISOString(),
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit,
      incomeByCategory: Array.from(incomeByCategory.values()).sort((a, b) => b.total - a.total),
      expenseByCategory: Array.from(expenseByCategory.values()).sort((a, b) => b.total - a.total),
      transactionCount: transactions.length,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to generate P&L report:", e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
