import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invoiceCreateSchema } from "@/lib/validators";
import { calculateLineItem } from "@/lib/vat";
import { addDays } from "date-fns";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } },
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be edited" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = invoiceCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const issueDate = new Date(data.issueDate);
    const dueDate = addDays(issueDate, data.paymentTermDays);
    const supplyDate = data.supplyDate ? new Date(data.supplyDate) : null;

    const invoice = await prisma.$transaction(async (tx) => {
      const processedLineItems = data.lineItems.map((item, index) => {
        const { netAmount, vatAmount, grossAmount } = calculateLineItem(
          item.quantity,
          item.unitPrice,
          item.taxRate
        );

        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          taxRate: item.taxRate,
          netAmount,
          vatAmount,
          grossAmount,
          sortOrder: index,
          serviceId: item.serviceId || undefined,
        };
      });

      const subtotal = processedLineItems.reduce(
        (sum, item) => sum + item.netAmount,
        0
      );
      const totalVat = processedLineItems.reduce(
        (sum, item) => sum + item.vatAmount,
        0
      );
      const total = Math.round((subtotal + totalVat) * 100) / 100;

      // Delete old line items
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: id } });

      // Update invoice with new line items
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          issueDate,
          supplyDate,
          dueDate,
          currency: data.currency,
          notes: data.notes,
          paymentTermDays: data.paymentTermDays,
          clientId: data.clientId,
          subtotal,
          totalVat,
          total,
          lineItems: {
            create: processedLineItems,
          },
        },
        include: {
          lineItems: { orderBy: { sortOrder: "asc" } },
          client: true,
        },
      });

      return updated;
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
