import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const template = await prisma.invoiceTemplate.findUnique({
      where: { id },
      include: {
        lineItems: {
          orderBy: { sortOrder: "asc" },
          include: { service: { select: { id: true, name: true } } },
        },
      },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(template);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to fetch template" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { name, description, lineItems } = body;

    if (!name || !lineItems?.length) {
      return NextResponse.json({ error: "Name and at least one line item required" }, { status: 400 });
    }

    // Delete old line items and recreate
    await prisma.invoiceTemplateItem.deleteMany({ where: { templateId: id } });

    const template = await prisma.invoiceTemplate.update({
      where: { id },
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

    return NextResponse.json(template);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to update template:", e);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.invoiceTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
