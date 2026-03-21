import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { startOfMonth, subMonths, format, addDays } from "date-fns";
import { getBaseCurrency, convertToBase } from "@/lib/exchange-rates";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get("months") || "12");

    const startDate = startOfMonth(subMonths(new Date(), months - 1));

    const baseCurrency = await getBaseCurrency();

    // Actual cash inflows: paid invoices by paidAt date
    const paidInvoices = await prisma.invoice.findMany({
      where: { status: "paid", paidAt: { gte: startDate } },
      select: { total: true, paidAt: true, currency: true, exchangeRate: true },
    });

    // Actual cash outflows: expense transactions
    const expenses = await prisma.transaction.findMany({
      where: { type: "expense", date: { gte: startDate } },
      select: { amount: true, date: true },
    });

    // Projected inflows: outstanding invoices by due date
    const outstanding = await prisma.invoice.findMany({
      where: { status: { in: ["sent", "overdue"] } },
      select: { total: true, dueDate: true, currency: true, exchangeRate: true, status: true },
    });

    // Build monthly data
    const monthlyMap = new Map<string, {
      inflow: number;
      outflow: number;
      projectedInflow: number;
      net: number;
    }>();

    for (let i = months - 1; i >= 0; i--) {
      const key = format(subMonths(new Date(), i), "yyyy-MM");
      monthlyMap.set(key, { inflow: 0, outflow: 0, projectedInflow: 0, net: 0 });
    }

    // Also add next 3 months for projections
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const key = format(futureDate, "yyyy-MM");
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, { inflow: 0, outflow: 0, projectedInflow: 0, net: 0 });
      }
    }

    for (const inv of paidInvoices) {
      if (!inv.paidAt) continue;
      const key = format(inv.paidAt, "yyyy-MM");
      const entry = monthlyMap.get(key);
      if (entry) {
        const converted = await convertToBase(inv.total, inv.currency, baseCurrency, inv.exchangeRate);
        entry.inflow = Math.round((entry.inflow + converted) * 100) / 100;
      }
    }

    for (const exp of expenses) {
      const key = format(exp.date, "yyyy-MM");
      const entry = monthlyMap.get(key);
      if (entry) {
        entry.outflow = Math.round((entry.outflow + exp.amount) * 100) / 100;
      }
    }

    for (const inv of outstanding) {
      const key = format(inv.dueDate, "yyyy-MM");
      const entry = monthlyMap.get(key);
      if (entry) {
        const converted = await convertToBase(inv.total, inv.currency, baseCurrency, inv.exchangeRate);
        entry.projectedInflow = Math.round((entry.projectedInflow + converted) * 100) / 100;
      }
    }

    // Calculate net and running balance
    let runningBalance = 0;
    const monthly = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        data.net = Math.round((data.inflow - data.outflow) * 100) / 100;
        runningBalance = Math.round((runningBalance + data.net) * 100) / 100;
        return { month, ...data, cumulativeBalance: runningBalance };
      });

    // Summary stats
    const currentMonthKey = format(new Date(), "yyyy-MM");
    const currentMonth = monthly.find((m) => m.month === currentMonthKey);

    let totalInflow = 0;
    for (const inv of paidInvoices) {
      totalInflow = Math.round((totalInflow + await convertToBase(inv.total, inv.currency, baseCurrency, inv.exchangeRate)) * 100) / 100;
    }
    const totalOutflow = expenses.reduce((sum, exp) => Math.round((sum + exp.amount) * 100) / 100, 0);
    let totalProjected = 0;
    for (const inv of outstanding) {
      totalProjected = Math.round((totalProjected + await convertToBase(inv.total, inv.currency, baseCurrency, inv.exchangeRate)) * 100) / 100;
    }

    // Upcoming receivables (next 30 days)
    const thirtyDaysOut = addDays(new Date(), 30);
    let upcomingReceivables = 0;
    for (const inv of outstanding.filter((inv) => inv.dueDate <= thirtyDaysOut)) {
      upcomingReceivables = Math.round((upcomingReceivables + await convertToBase(inv.total, inv.currency, baseCurrency, inv.exchangeRate)) * 100) / 100;
    }

    return NextResponse.json({
      monthly,
      summary: {
        totalInflow,
        totalOutflow,
        netCashflow: Math.round((totalInflow - totalOutflow) * 100) / 100,
        totalProjectedInflow: totalProjected,
        upcomingReceivables30d: upcomingReceivables,
        currentMonthInflow: currentMonth?.inflow || 0,
        currentMonthOutflow: currentMonth?.outflow || 0,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to generate cashflow report:", e);
    return NextResponse.json({ error: "Failed to generate cashflow report" }, { status: 500 });
  }
}
