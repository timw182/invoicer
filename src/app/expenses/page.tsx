"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { Plus, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  taxAmount: number;
  date: string;
  category: { name: string; color: string | null } | null;
  account: { name: string } | null;
  receiptUrl: string | null;
}

export default function ExpensesPage() {
  const t = useTranslations("expenses");
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions?type=expense");
      if (res.ok) setExpenses(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={expenses.length > 0 ? `Total: ${formatCurrency(totalExpenses)}` : undefined}
        action={
          <Link href="/expenses/new">
            <Button><Plus className="h-4 w-4 mr-2" /> {t("addExpense")}</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-5"><div className="h-32 animate-pulse rounded bg-muted" /></div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-3 mb-3"><Receipt className="h-6 w-6 text-muted-foreground" /></div>
              <p className="text-sm font-medium text-muted-foreground">{t("noExpenses")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Description</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Category</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Account</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Tax</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(tx.date)}</TableCell>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {tx.description}
                        {tx.receiptUrl && <Receipt className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      {tx.category ? (
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tx.category.color || "#6b7280" }} />
                          <span className="text-xs">{tx.category.name}</span>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.account?.name || "—"}</TableCell>
                    <TableCell className="text-sm text-right tabular-nums text-muted-foreground">
                      {tx.taxAmount > 0 ? formatCurrency(tx.taxAmount) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-right tabular-nums font-medium text-red-600">
                      {formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
