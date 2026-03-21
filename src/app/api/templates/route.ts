import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireAuth, AuthError } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const templates = await prisma.invoiceTemplate.findMany({
      orderBy: { name: "asc" },
      include: {
        lineItems: {
          orderBy: { sortOrder: "asc" },
          include: { service: { select: { id: true, name: true } } },
        },
      },
    });
    return NextResponse.json(templates);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { name, description, lineItems } = body;

    if (!name || !lineItems?.length) {
      return NextResponse.json({ error: "Name and at least one line item required" }, { status: 400 });
    }

    const template = await prisma.invoiceTemplate.create({
      data: {
        name,
        description: description || null,
        lineItems: {
          create: lineItems.map((item: Record<string, unknown>, index: number) => ({
            description: item.description as string,
            quantity: (item.quantity as number) || 1,
            unit: (item.unit as string) || "hour",
            unitPrice: (item.unitPrice as number) || 0,
            discount: (item.discount as number) || 0,
            taxRate: (item.taxRate as number) ?? 17,
            sortOrder: index,
            ...(item.serviceId ? { serviceId: item.serviceId as string } : {}),
          })),
        },
      },
      include: { lineItems: true },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to create template:", e);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
