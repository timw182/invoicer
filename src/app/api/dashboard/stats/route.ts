import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subMonths, startOfMonth, format, addDays, differenceInDays } from "date-fns";
import { requireAuth, AuthError } from "@/lib/auth";

async function markOverdueInvoices() {
  await prisma.invoice.updateMany({
    where: {
      status: "sent",
      dueDate: { lt: new Date() },
    },
    data: { status: "overdue" },
  });
}

export async function GET() {
  try {
    await requireAuth();
    await markOverdueInvoices();

    const [
      totalRevenueResult,
      outstandingResult,
      overdueResult,
      overdueCount,
      totalInvoices,
      recentInvoices,
      incomeResult,
      totalBalanceResult,
    ] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: "paid" },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: "sent" },
      }),
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: "overdue" },
      }),
      prisma.invoice.count({
        where: { status: "overdue" },
      }),
      prisma.invoice.count(),
      prisma.invoice.findMany({
        take: 5,
        orderBy: { issueDate: "desc" },
        include: { client: true },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "income" },
      }),
      prisma.bankAccount.aggregate({
        _sum: { balance: true },
      }),
    ]);

    // Monthly revenue for last 12 months
    const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: "paid",
        paidAt: { gte: twelveMonthsAgo },
      },
      select: {
        total: true,
        paidAt: true,
      },
    });

    // Group by month in JS since SQLite lacks good date functions
    const monthlyMap = new Map<string, number>();

    // Initialize all 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const key = format(startOfMonth(monthDate), "yyyy-MM");
      monthlyMap.set(key, 0);
    }

    for (const inv of paidInvoices) {
      if (inv.paidAt) {
        const key = format(inv.paidAt, "yyyy-MM");
        const existing = monthlyMap.get(key) ?? 0;
        monthlyMap.set(key, Math.round((existing + inv.total) * 100) / 100);
      }
    }

    const monthlyRevenue = Array.from(monthlyMap.entries()).map(
      ([month, revenue]) => ({ month, revenue })
    );

    // Invoices needing attention (due soon or overdue)
    const threeDaysFromNow = addDays(new Date(), 3);
    const actionNeeded = await prisma.invoice.findMany({
      where: {
        OR: [
          { status: "sent", dueDate: { lte: threeDaysFromNow } },
          { status: "overdue" },
        ],
      },
      include: { client: true, reminders: { orderBy: { sentAt: "desc" }, take: 1 } },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    // Upcoming recurring invoices
    const upcomingRecurring = await prisma.recurringInvoice.findMany({
      where: {
        active: true,
        nextGenerateAt: { lte: addDays(new Date(), 7) },
      },
      include: { client: true },
      orderBy: { nextGenerateAt: "asc" },
      take: 5,
    });

    // KPI calculations
    const thisMonth = startOfMonth(new Date());
    const lastMonth = startOfMonth(subMonths(new Date(), 1));

    // Monthly invoice counts for trend
    const allInvoices = await prisma.invoice.findMany({
      where: { issueDate: { gte: twelveMonthsAgo } },
      select: { issueDate: true, status: true, total: true, paidAt: true, dueDate: true },
    });

    const monthlyInvoiceCount = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      monthlyInvoiceCount.set(format(startOfMonth(subMonths(new Date(), i)), "yyyy-MM"), 0);
    }
    for (const inv of allInvoices) {
      const key = format(inv.issueDate, "yyyy-MM");
      monthlyInvoiceCount.set(key, (monthlyInvoiceCount.get(key) ?? 0) + 1);
    }

    // This month vs last month revenue
    const thisMonthKey = format(thisMonth, "yyyy-MM");
    const lastMonthKey = format(lastMonth, "yyyy-MM");
    const thisMonthRevenue = monthlyMap.get(thisMonthKey) ?? 0;
    const lastMonthRevenue = monthlyMap.get(lastMonthKey) ?? 0;
    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
      : 0;

    // DSO (Days Sales Outstanding) - avg days from issue to payment
    const paidWithDates = allInvoices.filter((i) => i.status === "paid" && i.paidAt);
    const paymentDays = paidWithDates.map((i) => differenceInDays(new Date(i.paidAt!), new Date(i.issueDate)));
    const avgDSO = paymentDays.length > 0
      ? Math.round(paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length)
      : 0;

    // Collection rate: paid / (paid + overdue)
    const paidCount = allInvoices.filter((i) => i.status === "paid").length;
    const overdueTotal = allInvoices.filter((i) => i.status === "overdue").length;
    const collectionRate = (paidCount + overdueTotal) > 0
      ? Math.round((paidCount / (paidCount + overdueTotal)) * 1000) / 10
      : 100;

    // Average invoice value
    const avgInvoiceValue = allInvoices.length > 0
      ? Math.round((allInvoices.reduce((s, i) => s + i.total, 0) / allInvoices.length) * 100) / 100
      : 0;

    // This month invoice count vs last month
    const thisMonthCount = monthlyInvoiceCount.get(thisMonthKey) ?? 0;
    const lastMonthCount = monthlyInvoiceCount.get(lastMonthKey) ?? 0;

    return NextResponse.json({
      totalRevenue: totalRevenueResult._sum.total ?? 0,
      outstanding: outstandingResult._sum.total ?? 0,
      overdue: overdueResult._sum.total ?? 0,
      overdueCount,
      totalInvoices,
      income: incomeResult._sum.amount ?? 0,
      totalBalance: totalBalanceResult._sum.balance ?? 0,
      recentInvoices,
      monthlyRevenue,
      actionNeeded,
      upcomingRecurring,
      kpi: {
        thisMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        avgDSO,
        collectionRate,
        avgInvoiceValue,
        thisMonthCount,
        lastMonthCount,
        monthlyInvoiceCounts: Array.from(monthlyInvoiceCount.entries()).map(([month, count]) => ({ month, count })),
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to fetch dashboard stats:", e);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
