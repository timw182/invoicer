import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { clientId, confirm } = await request.json();

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    if (confirm !== "DELETE") {
      return NextResponse.json(
        { error: 'You must pass { confirm: "DELETE" } to confirm erasure' },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { invoices: { select: { id: true, invoiceNumber: true } } },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const invoiceIds = client.invoices.map((i) => i.id);
    const invoiceNumbers = client.invoices.map((i) => i.invoiceNumber);

    // Delete in order: line items, reminders, transactions, invoices, recurring, client
    await prisma.$transaction(async (tx) => {
      // Delete invoice line items
      await tx.invoiceLineItem.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      // Delete reminders
      await tx.reminder.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      // Delete linked transactions
      await tx.transaction.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });

      // Delete invoices
      await tx.invoice.deleteMany({
        where: { clientId },
      });

      // Delete recurring invoices and their line items
      const recurringIds = await tx.recurringInvoice.findMany({
        where: { clientId },
        select: { id: true },
      });
      if (recurringIds.length > 0) {
        await tx.recurringLineItem.deleteMany({
          where: { recurringInvoiceId: { in: recurringIds.map((r) => r.id) } },
        });
        await tx.recurringInvoice.deleteMany({
          where: { clientId },
        });
      }

      // Delete the client
      await tx.client.delete({ where: { id: clientId } });
    });

    await audit({
      userId: user.id,
      userName: user.name,
      action: "delete",
      entity: "client",
      entityId: clientId,
      details: `GDPR erasure: client "${client.name}" and ${invoiceIds.length} invoices (${invoiceNumbers.join(", ")})`,
    });

    return NextResponse.json({
      success: true,
      deleted: {
        client: client.name,
        invoices: invoiceIds.length,
        invoiceNumbers,
      },
      message: `Client "${client.name}" and all associated data has been permanently deleted.`,
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("GDPR deletion failed:", e);
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
