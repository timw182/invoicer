import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { shouldReverseCharge, calculateLineItem } from "@/lib/vat";
import { advanceDate } from "@/lib/recurring";
import { addDays, subDays } from "date-fns";
import { sendInvoiceEmail, sendReminderEmail } from "@/lib/email";
import { performBackup } from "@/lib/backup";
import { audit } from "@/lib/audit";

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCron(request: Request): boolean {
  if (!CRON_SECRET) return true; // No secret = no protection (dev mode)
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${CRON_SECRET}`;
}

async function markOverdueInvoices() {
  const result = await prisma.invoice.updateMany({
    where: {
      status: "sent",
      dueDate: { lt: new Date() },
    },
    data: { status: "overdue" },
  });
  return result.count;
}

async function generateRecurringInvoices() {
  const now = new Date();
  const due = await prisma.recurringInvoice.findMany({
    where: {
      active: true,
      nextGenerateAt: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  const results: Array<{ recurringId: string; invoiceId: string; invoiceNumber: string; emailSent: boolean }> = [];

  for (const recurring of due) {
    try {
      const invoice = await prisma.$transaction(async (tx) => {
        const profile = await tx.businessProfile.findFirstOrThrow();
        const client = recurring.client;

        const invoiceNumber = await generateInvoiceNumber(tx);
        const issueDate = new Date();
        const dueDate = addDays(issueDate, recurring.paymentTermDays);

        const supplierCountry = profile.country || "LU";

        const reverseCharge = shouldReverseCharge(
          supplierCountry,
          client.country,
          client.taxId
        );

        const processedLineItems = recurring.lineItems.map((item, index) => {
          let taxRate = item.taxRate;
          const discount = item.discount ?? 0;

          if (profile.smallBusinessExemption) {
            taxRate = 0;
          } else if (reverseCharge) {
            taxRate = 0;
          }

          const { netAmount, vatAmount, grossAmount } = calculateLineItem(
            item.quantity,
            item.unitPrice,
            taxRate,
            discount
          );

          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
            discount,
            taxRate,
            netAmount,
            vatAmount,
            grossAmount,
            sortOrder: index,
            ...(item.serviceId ? { serviceId: item.serviceId } : {}),
          };
        });

        const subtotal = processedLineItems.reduce((sum, item) => sum + item.netAmount, 0);
        const totalVat = processedLineItems.reduce((sum, item) => sum + item.vatAmount, 0);
        const total = Math.round((subtotal + totalVat) * 100) / 100;

        let vatExemptionNote: string | undefined;
        if (profile.smallBusinessExemption && profile.exemptionNote) {
          vatExemptionNote = profile.exemptionNote;
        }

        const created = await tx.invoice.create({
          data: {
            invoiceNumber,
            status: recurring.autoSend ? "sent" : "draft",
            issueDate,
            dueDate,
            currency: recurring.currency,
            supplierName: profile.name,
            supplierAddress: profile.address,
            supplierVatId: profile.vatId,
            clientName: client.name,
            clientAddress: client.billingAddress || client.address,
            clientVatId: client.taxId,
            clientCountry: client.country,
            supplierCountry,
            subtotal,
            totalVat,
            total,
            reverseCharge,
            vatExemptionNote,
            notes: recurring.notes,
            paymentTermDays: recurring.paymentTermDays,
            clientId: client.id,
            recurringInvoiceId: recurring.id,
            lineItems: { create: processedLineItems },
          },
        });

        await tx.recurringInvoice.update({
          where: { id: recurring.id },
          data: {
            nextGenerateAt: advanceDate(recurring.nextGenerateAt, recurring.frequency),
            generatedCount: { increment: 1 },
            lastGeneratedAt: new Date(),
          },
        });

        return created;
      });

      // Send email if autoSend is enabled and client has email
      let emailSent = false;
      if (recurring.autoSend && recurring.client.email) {
        emailSent = await sendInvoiceEmail(invoice, recurring.client.email);
      }

      results.push({
        recurringId: recurring.id,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        emailSent,
      });
    } catch (error) {
      console.error(`Failed to generate invoice for recurring ${recurring.id}:`, error);
    }
  }

  return results;
}

async function generateReminders() {
  const now = new Date();
  const threeDaysFromNow = addDays(now, 3);
  const sevenDaysAgo = subDays(now, 7);

  // Upcoming: sent invoices due within 3 days, not yet reminded
  const upcoming = await prisma.invoice.findMany({
    where: {
      status: "sent",
      dueDate: { lte: threeDaysFromNow, gte: now },
      reminders: { none: { type: "upcoming" } },
    },
    include: { client: true },
  });

  // Overdue: overdue invoices not reminded in last 7 days
  const overdue = await prisma.invoice.findMany({
    where: {
      status: "overdue",
      reminders: {
        none: {
          type: { in: ["overdue", "overdue_followup"] },
          sentAt: { gte: sevenDaysAgo },
        },
      },
    },
    include: {
      client: true,
      reminders: { select: { type: true }, take: 1 },
    },
  });

  const reminders: Array<{ invoiceId: string; type: string; emailSent: boolean }> = [];

  for (const inv of upcoming) {
    await prisma.reminder.create({
      data: { invoiceId: inv.id, type: "upcoming" },
    });
    let emailSent = false;
    if (inv.client.email) {
      emailSent = await sendReminderEmail(inv, inv.client.email, "upcoming");
    }
    reminders.push({ invoiceId: inv.id, type: "upcoming", emailSent });
  }

  for (const inv of overdue) {
    const hasBeenReminded = inv.reminders.length > 0;
    const type = hasBeenReminded ? "overdue_followup" : "overdue";
    await prisma.reminder.create({
      data: { invoiceId: inv.id, type },
    });
    let emailSent = false;
    if (inv.client.email) {
      emailSent = await sendReminderEmail(inv, inv.client.email, type as "overdue" | "overdue_followup");
    }
    reminders.push({ invoiceId: inv.id, type, emailSent });
  }

  return reminders;
}

export async function POST(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [overdueCount, generatedInvoices, reminders] = await Promise.all([
      markOverdueInvoices(),
      generateRecurringInvoices(),
      generateReminders(),
    ]);

    // Daily backup
    const backupResult = await performBackup();
    await audit({
      action: "backup",
      entity: "backup",
      details: `Cron backup: ${backupResult.filename} (cloud: ${backupResult.cloud})`,
    });

    return NextResponse.json({
      success: true,
      processedAt: new Date().toISOString(),
      overdueMarked: overdueCount,
      invoicesGenerated: generatedInvoices.length,
      generatedInvoices,
      remindersCreated: reminders.length,
      reminders,
      backup: backupResult,
    });
  } catch (error) {
    console.error("Cron processing failed:", error);
    return NextResponse.json(
      { error: "Cron processing failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
