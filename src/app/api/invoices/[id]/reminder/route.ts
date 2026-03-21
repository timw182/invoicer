import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, AuthError } from "@/lib/auth";
import { sendReminderEmail } from "@/lib/email";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (!["sent", "overdue"].includes(invoice.status)) {
      return NextResponse.json(
        { error: "Can only send reminders for sent or overdue invoices" },
        { status: 400 }
      );
    }

    const type = invoice.status === "overdue" ? "overdue_followup" : "upcoming";

    const reminder = await prisma.reminder.create({
      data: { invoiceId: id, type },
    });

    let emailSent = false;
    if (invoice.client.email) {
      emailSent = await sendReminderEmail(
        invoice,
        invoice.client.email,
        type as "upcoming" | "overdue" | "overdue_followup"
      );
    }

    return NextResponse.json({ ...reminder, emailSent }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to create reminder:", e);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
