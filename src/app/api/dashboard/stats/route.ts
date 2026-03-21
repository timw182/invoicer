import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { subMonths, startOfMonth, format, addDays } from "date-fns";
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
