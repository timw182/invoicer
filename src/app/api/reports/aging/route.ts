import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { differenceInDays } from "date-fns";

export async function GET() {
  try {
    await requireAuth();

    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ["sent", "overdue"] } },
      include: { client: { select: { id: true, name: true } } },
      orderBy: { dueDate: "asc" },
    });

    const now = new Date();

    const buckets = {
      current: { label: "Not yet due", invoices: [] as typeof invoices, total: 0 },
      "1-30": { label: "1–30 days", invoices: [] as typeof invoices, total: 0 },
      "31-60": { label: "31–60 days", invoices: [] as typeof invoices, total: 0 },
      "61-90": { label: "61–90 days", invoices: [] as typeof invoices, total: 0 },
      "90+": { label: "90+ days", invoices: [] as typeof invoices, total: 0 },
    };

    const clientTotals = new Map<string, { name: string; total: number; count: number; oldest: number }>();

    for (const inv of invoices) {
      const daysOverdue = differenceInDays(now, new Date(inv.dueDate));

      let bucket: keyof typeof buckets;
      if (daysOverdue <= 0) bucket = "current";
      else if (daysOverdue <= 30) bucket = "1-30";
      else if (daysOverdue <= 60) bucket = "31-60";
      else if (daysOverdue <= 90) bucket = "61-90";
      else bucket = "90+";

      buckets[bucket].invoices.push(inv);
      buckets[bucket].total = Math.round((buckets[bucket].total + inv.total) * 100) / 100;

      // Client aggregation
      const existing = clientTotals.get(inv.clientId);
      if (existing) {
        existing.total = Math.round((existing.total + inv.total) * 100) / 100;
        existing.count += 1;
        existing.oldest = Math.max(existing.oldest, daysOverdue);
      } else {
        clientTotals.set(inv.clientId, {
          name: inv.client.name,
          total: inv.total,
          count: 1,
          oldest: daysOverdue,
        });
      }
    }

    const totalOutstanding = invoices.reduce((sum, inv) => Math.round((sum + inv.total) * 100) / 100, 0);

    const summary = Object.entries(buckets).map(([key, b]) => ({
      bucket: key,
      label: b.label,
      count: b.invoices.length,
      total: b.total,
      percentage: totalOutstanding > 0 ? Math.round((b.total / totalOutstanding) * 1000) / 10 : 0,
    }));

    const byClient = Array.from(clientTotals.entries())
      .map(([clientId, data]) => ({ clientId, ...data }))
      .sort((a, b) => b.total - a.total);

    const details = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.client.name,
      clientId: inv.clientId,
      total: inv.total,
      currency: inv.currency,
      dueDate: inv.dueDate,
      daysOverdue: Math.max(0, differenceInDays(now, new Date(inv.dueDate))),
      status: inv.status,
    }));

    return NextResponse.json({
      totalOutstanding,
      totalCount: invoices.length,
      summary,
      byClient,
      details,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to generate aging report:", e);
    return NextResponse.json({ error: "Failed to generate aging report" }, { status: 500 });
  }
}
