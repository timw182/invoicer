import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invoiceStatusSchema } from "@/lib/validators";
import { requireAuth, requireAdmin, AuthError } from "@/lib/auth";
import { sendInvoiceEmail } from "@/lib/email";

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent", "cancelled"],
  sent: ["paid", "overdue", "cancelled"],
  overdue: ["paid", "cancelled"],
  paid: [],
  cancelled: [],
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = invoiceStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status: newStatus } = parsed.data;
    const currentStatus = invoice.status;

    // Only admins can mark invoices as paid
    if (newStatus === "paid") {
      await requireAdmin();
    }

    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
        },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "paid") {
      updateData.paidAt = new Date();
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { client: true },
    });

    // Send invoice email when status changes to "sent"
    if (newStatus === "sent" && updated.client.email) {
      await sendInvoiceEmail(updated, updated.client.email);
    }

    // Auto-create income transaction when invoice is paid
    if (newStatus === "paid") {
      const salesCategory = await prisma.category.findFirst({
        where: { name: "Sales", type: "income" },
      });

      await prisma.transaction.create({
        data: {
          type: "income",
          description: `Invoice ${updated.invoiceNumber} — ${updated.clientName}`,
          amount: updated.total,
          taxAmount: updated.totalVat,
          taxRate: updated.totalVat > 0 && updated.subtotal > 0
            ? Math.round((updated.totalVat / updated.subtotal) * 100 * 100) / 100
            : 0,
          date: updated.paidAt || new Date(),
          invoiceId: updated.id,
          ...(salesCategory ? { categoryId: salesCategory.id } : {}),
        },
      });
    }

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to update invoice status:", e);
    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 }
    );
  }
}
