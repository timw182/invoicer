"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";

interface PLReport {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByCategory: Array<{ name: string; color: string | null; total: number }>;
  expenseByCategory: Array<{ name: string; color: string | null; total: number }>;
}

export default function ReportsPage() {
  const [report, setReport] = useState<PLReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/profit-loss?from=${fromDate}&to=${toDate}`)
      .then((r) => r.json())
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Profit & Loss and expense breakdown"
        action={
          <div className="flex items-center gap-2">
            <Link href="/reports/aging"><Button variant="outline" size="sm">Aging</Button></Link>
            <Link href="/reports/cashflow"><Button variant="outline" size="sm">Cash Flow</Button></Link>
            <Link href="/reports/clients"><Button variant="outline" size="sm">Clients</Button></Link>
            <Link href="/reports/tax"><Button variant="outline" size="sm">Tax</Button></Link>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">From</span>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">To</span>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="p-5"><div className="h-48 animate-pulse rounded bg-muted" /></CardContent></Card>
      ) : report ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Income</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(report.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(report.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">Net Profit</p>
                <p className={`text-2xl font-bold mt-1 ${report.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(report.netProfit)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Income by Category</CardTitle></CardHeader>
              <CardContent>
                {report.incomeByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No income in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {report.incomeByCategory.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color || "#6b7280" }} />
                            <span>{cat.name}</span>
                          </div>
                          <span className="font-medium tabular-nums">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: cat.color || "#10b981",
                              width: `${Math.min(100, (cat.total / report.totalIncome) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
              <CardContent>
                {report.expenseByCategory.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expenses in this period.</p>
                ) : (
                  <div className="space-y-3">
                    {report.expenseByCategory.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color || "#6b7280" }} />
                            <span>{cat.name}</span>
                          </div>
                          <span className="font-medium tabular-nums">{formatCurrency(cat.total)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: cat.color || "#ef4444",
                              width: `${Math.min(100, (cat.total / report.totalExpenses) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
