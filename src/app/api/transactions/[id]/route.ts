import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { transactionSchema } from "@/lib/validators";
import { requireAuth, AuthError } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        category: true,
        account: true,
        invoice: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to fetch transaction:", e);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
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
    const parsed = transactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const data = {
      ...parsed.data,
      date: new Date(parsed.data.date),
    };

    // Reverse the old balance effect
    if (existing.accountId) {
      const oldBalanceChange =
        existing.type === "income" ? -existing.amount : existing.amount;

      await prisma.bankAccount.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: oldBalanceChange },
        },
      });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data,
      include: {
        category: true,
        account: true,
        invoice: true,
      },
    });

    // Apply the new balance effect
    if (data.accountId) {
      const newBalanceChange =
        data.type === "income" ? data.amount : -data.amount;

      await prisma.bankAccount.update({
        where: { id: data.accountId },
        data: {
          balance: { increment: newBalanceChange },
        },
      });
    }

    return NextResponse.json(transaction);
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to update transaction:", e);
    return NextResponse.json(
      { error: "Failed to update transaction" },
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

    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Reverse the balance effect on the linked account
    if (existing.accountId) {
      const balanceChange =
        existing.type === "income" ? -existing.amount : existing.amount;

      await prisma.bankAccount.update({
        where: { id: existing.accountId },
        data: {
          balance: { increment: balanceChange },
        },
      });
    }

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("Failed to delete transaction:", e);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
