import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { recurringInvoiceSchema } from "@/lib/validators";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const recurring = await prisma.recurringInvoice.findMany({
      include: {
        client: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        _count: { select: { generatedInvoices: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(recurring);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to fetch recurring invoices:", e);
    return NextResponse.json(
      { error: "Failed to fetch recurring invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = recurringInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const startDate = new Date(data.startDate);

    const recurring = await prisma.recurringInvoice.create({
      data: {
        name: data.name,
        clientId: data.clientId,
        frequency: data.frequency,
        startDate,
        endDate: data.endDate ? new Date(data.endDate) : null,
        nextGenerateAt: startDate,
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

    return NextResponse.json(recurring, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to create recurring invoice:", e);
    return NextResponse.json(
      { error: "Failed to create recurring invoice" },
      { status: 500 }
    );
  }
}
