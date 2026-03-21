import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recurringInvoiceSchema } from "@/lib/validators";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const recurring = await prisma.recurringInvoice.findUnique({
      where: { id },
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        generatedInvoices: {
          orderBy: { issueDate: "desc" },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            issueDate: true,
            dueDate: true,
            total: true,
            currency: true,
          },
        },
      },
    });

    if (!recurring) {
      return NextResponse.json(
        { error: "Recurring invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(recurring);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to fetch recurring invoice:", e);
    return NextResponse.json(
      { error: "Failed to fetch recurring invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = recurringInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const recurring = await prisma.$transaction(async (tx) => {
      await tx.recurringLineItem.deleteMany({ where: { recurringInvoiceId: id } });

      return tx.recurringInvoice.update({
        where: { id },
        data: {
          name: data.name,
          clientId: data.clientId,
          frequency: data.frequency,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          currency: data.currency,
          paymentTermDays: data.paymentTermDays,
          notes: data.notes,
          autoSend: data.autoSend,
          lineItems: {
            create: data.lineItems.map((item, index) => ({
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount ?? 0,
              taxRate: item.taxRate,
              sortOrder: index,
              ...(item.serviceId ? { serviceId: item.serviceId } : {}),
            })),
          },
        },
        include: {
          client: true,
          lineItems: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json(recurring);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to update recurring invoice:", e);
    return NextResponse.json(
      { error: "Failed to update recurring invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    await prisma.recurringInvoice.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to deactivate recurring invoice:", e);
    return NextResponse.json(
      { error: "Failed to deactivate recurring invoice" },
      { status: 500 }
    );
  }
}
