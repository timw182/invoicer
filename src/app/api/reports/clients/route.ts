import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { differenceInDays } from "date-fns";
import { getBaseCurrency, convertToBase } from "@/lib/exchange-rates";

export async function GET() {
  try {
    await requireAuth();

    const baseCurrency = await getBaseCurrency();

    const clients = await prisma.client.findMany({
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            currency: true,
            exchangeRate: true,
            status: true,
            issueDate: true,
            dueDate: true,
            paidAt: true,
          },
          orderBy: { issueDate: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const clientAnalysis = await Promise.all(clients
      .filter((c) => c.invoices.length > 0)
      .map(async (client) => {
        const invoices = client.invoices;
        const paidInvoices = invoices.filter((i) => i.status === "paid" && i.paidAt);
        const outstandingInvoices = invoices.filter((i) => ["sent", "overdue"].includes(i.status));
        const overdueInvoices = invoices.filter((i) => i.status === "overdue");

        // Revenue (converted to base currency)
        let totalRevenue = 0;
        for (const i of paidInvoices) {
          totalRevenue = Math.round((totalRevenue + await convertToBase(i.total, i.currency, baseCurrency, i.exchangeRate)) * 100) / 100;
        }
        let totalOutstanding = 0;
        for (const i of outstandingInvoices) {
          totalOutstanding = Math.round((totalOutstanding + await convertToBase(i.total, i.currency, baseCurrency, i.exchangeRate)) * 100) / 100;
        }

        // Payment speed analysis
        const paymentDays = paidInvoices
          .map((i) => {
            const issued = new Date(i.issueDate);
            const paid = new Date(i.paidAt!);
            return differenceInDays(paid, issued);
          })
          .filter((d) => d >= 0);

        const avgDaysToPayment = paymentDays.length > 0
          ? Math.round(paymentDays.reduce((a, b) => a + b, 0) / paymentDays.length)
          : null;

        const medianDaysToPayment = paymentDays.length > 0
          ? (() => {
              const sorted = [...paymentDays].sort((a, b) => a - b);
              const mid = Math.floor(sorted.length / 2);
              return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
            })()
          : null;

        // On-time payment rate
        const onTimeCount = paidInvoices.filter((i) => {
          if (!i.paidAt) return false;
          return new Date(i.paidAt) <= new Date(i.dueDate);
        }).length;

        const onTimeRate = paidInvoices.length > 0
          ? Math.round((onTimeCount / paidInvoices.length) * 1000) / 10
          : null;

        // Late payment analysis
        const latePayments = paidInvoices.filter((i) => {
          if (!i.paidAt) return false;
          return new Date(i.paidAt) > new Date(i.dueDate);
        });

        const avgLateDays = latePayments.length > 0
          ? Math.round(
              latePayments.reduce((sum, i) => sum + differenceInDays(new Date(i.paidAt!), new Date(i.dueDate)), 0) /
                latePayments.length
            )
          : 0;

        // Revenue trend (last 6 invoices)
        const recentInvoices = paidInvoices.slice(0, 6).reverse();

        return {
          clientId: client.id,
          clientName: client.name,
          email: client.email,
          country: client.country,
          totalInvoices: invoices.length,
          paidCount: paidInvoices.length,
          outstandingCount: outstandingInvoices.length,
          overdueCount: overdueInvoices.length,
          totalRevenue,
          totalOutstanding,
          avgDaysToPayment,
          medianDaysToPayment,
          onTimeRate,
          latePaymentCount: latePayments.length,
          avgLateDays,
          recentInvoices: recentInvoices.map((i) => ({
            invoiceNumber: i.invoiceNumber,
            total: i.total,
            issueDate: i.issueDate,
            paidAt: i.paidAt,
          })),
        };
      }));

    clientAnalysis.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Global stats
    const totalClients = clientAnalysis.length;
    const avgDSO = (() => {
      const allDays = clientAnalysis.filter((c) => c.avgDaysToPayment !== null).map((c) => c.avgDaysToPayment!);
      return allDays.length > 0 ? Math.round(allDays.reduce((a, b) => a + b, 0) / allDays.length) : 0;
    })();

    const topRevenue = clientAnalysis.slice(0, 5);
    const latePayers = clientAnalysis
      .filter((c) => c.onTimeRate !== null && c.onTimeRate < 70)
      .sort((a, b) => (a.onTimeRate ?? 100) - (b.onTimeRate ?? 100));

    return NextResponse.json({
      totalClients,
      avgDSO,
      topRevenue,
      latePayers,
      clients: clientAnalysis,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to generate client analysis:", e);
    return NextResponse.json({ error: "Failed to generate client analysis" }, { status: 500 });
  }
}
