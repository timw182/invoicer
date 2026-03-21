import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { requireAuth, AuthError } from "@/lib/auth";
import { getBaseCurrency, convertToBase } from "@/lib/exchange-rates";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
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

    const baseCurrency = await getBaseCurrency();

    // Get paid invoices for income (these have currency info)
    const paidInvoices = await prisma.invoice.findMany({
      where: { status: "paid", paidAt: { gte: from, lte: to } },
      select: { total: true, currency: true, exchangeRate: true },
    });

    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: from, lte: to } },
      include: { category: true, invoice: { select: { currency: true, exchangeRate: true } } },
    });

    const incomeByCategory = new Map<string, { name: string; color: string | null; total: number }>();
    const expenseByCategory = new Map<string, { name: string; color: string | null; total: number }>();

    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of transactions) {
      const catName = tx.category?.name || "Uncategorized";
      const catColor = tx.category?.color || null;
      const catId = tx.categoryId || "uncategorized";

      // Convert to base currency if linked to a foreign-currency invoice
      const txCurrency = tx.invoice?.currency || baseCurrency;
      const txRate = tx.invoice?.exchangeRate || null;
      const amount = await convertToBase(tx.amount, txCurrency, baseCurrency, txRate);

      if (tx.type === "income") {
        totalIncome += amount;
        const existing = incomeByCategory.get(catId);
        if (existing) {
          existing.total += amount;
        } else {
          incomeByCategory.set(catId, { name: catName, color: catColor, total: amount });
        }
      } else {
        totalExpenses += amount;
        const existing = expenseByCategory.get(catId);
        if (existing) {
          existing.total += amount;
        } else {
          expenseByCategory.set(catId, { name: catName, color: catColor, total: amount });
        }
      }
    }

    const netProfit = Math.round((totalIncome - totalExpenses) * 100) / 100;

    return NextResponse.json({
      from: from.toISOString(),
      to: to.toISOString(),
      baseCurrency,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfit,
      incomeByCategory: Array.from(incomeByCategory.values())
        .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }))
        .sort((a, b) => b.total - a.total),
      expenseByCategory: Array.from(expenseByCategory.values())
        .map((c) => ({ ...c, total: Math.round(c.total * 100) / 100 }))
        .sort((a, b) => b.total - a.total),
      transactionCount: transactions.length,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to generate P&L report:", e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
