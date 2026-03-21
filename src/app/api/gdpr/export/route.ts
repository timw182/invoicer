import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        invoices: {
          include: {
            lineItems: true,
            reminders: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { invoiceId: { in: client.invoices.map((i) => i.id) } },
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      exportType: "GDPR Data Export",
      client: {
        id: client.id,
        name: client.name,
        contactPerson: client.contactPerson,
        email: client.email,
        address: client.address,
        billingAddress: client.billingAddress,
        country: client.country,
        taxId: client.taxId,
        phone: client.phone,
        website: client.website,
        notes: client.notes,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
      },
      invoices: client.invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        total: inv.total,
        currency: inv.currency,
        lineItems: inv.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          unitPrice: li.unitPrice,
          taxRate: li.taxRate,
          netAmount: li.netAmount,
          grossAmount: li.grossAmount,
        })),
        reminders: inv.reminders.map((r) => ({
          type: r.type,
          sentAt: r.sentAt,
        })),
      })),
      transactions: transactions.map((tx) => ({
        type: tx.type,
        description: tx.description,
        amount: tx.amount,
        date: tx.date,
      })),
    };

    await audit({
      userId: user.id,
      userName: user.name,
      action: "export",
      entity: "client",
      entityId: clientId,
      details: `GDPR data export for client: ${client.name}`,
    });

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="gdpr-export-${client.name.replace(/[^a-zA-Z0-9]/g, "_")}-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("GDPR export failed:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
