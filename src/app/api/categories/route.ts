import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validators";
import { requireAuth, AuthError } from "@/lib/auth";

const DEFAULT_CATEGORIES = [
  { name: "Sales", type: "income", color: "#10b981" },
  { name: "Services", type: "income", color: "#3b82f6" },
  { name: "Recurring Revenue", type: "income", color: "#8b5cf6" },
  { name: "Other Income", type: "income", color: "#6b7280" },
  { name: "Office Supplies", type: "expense", color: "#f59e0b" },
  { name: "Software & Tools", type: "expense", color: "#3b82f6" },
  { name: "Travel", type: "expense", color: "#ef4444" },
  { name: "Professional Services", type: "expense", color: "#8b5cf6" },
  { name: "Marketing", type: "expense", color: "#ec4899" },
  { name: "Insurance", type: "expense", color: "#6b7280" },
  { name: "Rent", type: "expense", color: "#f97316" },
  { name: "Utilities", type: "expense", color: "#14b8a6" },
  { name: "Other", type: "expense", color: "#9ca3af" },
];

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where = type === "income" || type === "expense" ? { type } : undefined;

    let categories = await prisma.category.findMany({
      where,
      orderBy: { name: "asc" },
    });

    if (categories.length === 0 && !type) {
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES,
      });

      categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(categories);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to fetch categories:", e);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: parsed.data,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to create category:", e);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
