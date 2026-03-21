import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { invoiceCreateSchema } from "@/lib/validators";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { shouldReverseCharge, calculateLineItem } from "@/lib/vat";
import { addDays } from "date-fns";
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

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    await markOverdueInvoices();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { client: true },
      orderBy: { issueDate: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to fetch invoices:", e);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = invoiceCreateSchema.safeParse(body);

    if (!parsed.success) {
      const details = parsed.error.flatten();
      console.error("Invoice validation failed:", JSON.stringify(details, null, 2));
      return NextResponse.json(
        { error: "Validation failed", message: Object.values(details.fieldErrors).flat().join(", ") || "Invalid data", details },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const issueDate = new Date(data.issueDate);
    const dueDate = addDays(issueDate, data.paymentTermDays);
    const supplyDate = data.supplyDate ? new Date(data.supplyDate) : null;

    const invoice = await prisma.$transaction(async (tx) => {
      const profile = await tx.businessProfile.findFirstOrThrow();
      const client = await tx.client.findUniqueOrThrow({
        where: { id: data.clientId },
      });

      const invoiceNumber = await generateInvoiceNumber(tx);

      const supplierCountry = profile.country || "DE";

      const reverseCharge = shouldReverseCharge(
        supplierCountry,
        client.country,
        client.taxId
      );

      const processedLineItems = data.lineItems.map((item, index) => {
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

      const subtotal = processedLineItems.reduce(
        (sum, item) => sum + item.netAmount,
        0
      );
      const totalVat = processedLineItems.reduce(
        (sum, item) => sum + item.vatAmount,
        0
      );
      const total = Math.round((subtotal + totalVat) * 100) / 100;

      let vatExemptionNote: string | undefined;
      if (profile.smallBusinessExemption && profile.exemptionNote) {
        vatExemptionNote = profile.exemptionNote;
      }

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          invoiceType: data.invoiceType || "standard",
          status: "draft",
          issueDate,
          supplyDate,
          dueDate,
          currency: data.currency,
          customerReference: data.customerReference,
          exchangeRate: data.exchangeRate,
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
          notes: data.notes,
          paymentTermDays: data.paymentTermDays,
          clientId: client.id,
          lineItems: {
            create: processedLineItems,
          },
        },
        include: {
          lineItems: true,
          client: true,
        },
      });

      return created;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to create invoice:", e);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
