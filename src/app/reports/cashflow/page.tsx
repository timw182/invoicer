"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { format, parse } from "date-fns";

interface CashflowReport {
  monthly: Array<{
    month: string;
    inflow: number;
    outflow: number;
    projectedInflow: number;
    net: number;
    cumulativeBalance: number;
  }>;
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netCashflow: number;
    totalProjectedInflow: number;
    upcomingReceivables30d: number;
    currentMonthInflow: number;
    currentMonthOutflow: number;
  };
}

function formatMonth(monthStr: string): string {
  try {
    const date = parse(monthStr, "yyyy-MM", new Date());
    return format(date, "MMM yyyy");
  } catch {
    return monthStr;
  }
}

export default function CashflowPage() {
  const [report, setReport] = useState<CashflowReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/cashflow?months=12")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cash Flow" description="Cash inflows, outflows, and projections" />
        <Card><CardContent className="p-5"><div className="h-48 animate-pulse rounded bg-muted" /></CardContent></Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Cash Flow" description="Cash inflows, outflows, and projections" />
        <Card><CardContent className="p-8 text-center text-muted-foreground">Failed to load report.</CardContent></Card>
      </div>
    );
  }

  const s = report.summary;
  const currentMonth = format(new Date(), "yyyy-MM");

  return (
    <div className="space-y-6">
      <PageHeader title="Cash Flow" description="Cash inflows, outflows, and projections" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Inflow</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(s.totalInflow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Total Outflow</p>
            <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(s.totalOutflow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Net Cash Flow</p>
            <p className={`text-xl font-bold mt-1 ${s.netCashflow >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(s.netCashflow)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Expected (Outstanding)</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(s.totalProjectedInflow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Due in 30 Days</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(s.upcomingReceivables30d)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Bar Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Cash Flow</CardTitle></CardHeader>
        <CardContent>
          {(() => {
            const maxVal = Math.max(
              ...report.monthly.map((m) => Math.max(m.inflow, m.outflow, m.projectedInflow)),
              1
            );
            return (
              <div className="space-y-2">
                {report.monthly.map((m) => {
                  const isFuture = m.month > currentMonth;
                  return (
                    <div key={m.month} className={`flex items-center gap-3 ${isFuture ? "opacity-60" : ""}`}>
                      <span className="text-xs text-muted-foreground w-16 flex-shrink-0 tabular-nums">
                        {formatMonth(m.month)}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <div className="h-3 rounded-sm bg-emerald-500" style={{ width: `${(m.inflow / maxVal) * 100}%`, minWidth: m.inflow > 0 ? 4 : 0 }} />
                          {m.inflow > 0 && <span className="text-xs tabular-nums text-emerald-700">{formatCurrency(m.inflow)}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 rounded-sm bg-red-400" style={{ width: `${(m.outflow / maxVal) * 100}%`, minWidth: m.outflow > 0 ? 4 : 0 }} />
                          {m.outflow > 0 && <span className="text-xs tabular-nums text-red-600">{formatCurrency(m.outflow)}</span>}
                        </div>
                        {m.projectedInflow > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="h-3 rounded-sm bg-blue-300 border border-blue-400 border-dashed" style={{ width: `${(m.projectedInflow / maxVal) * 100}%`, minWidth: 4 }} />
                            <span className="text-xs tabular-nums text-blue-600">{formatCurrency(m.projectedInflow)} expected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          <div className="flex items-center gap-6 mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-emerald-500" /><span className="text-xs text-muted-foreground">Inflow</span></div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-red-400" /><span className="text-xs text-muted-foreground">Outflow</span></div>
            <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-blue-300 border border-blue-400 border-dashed" /><span className="text-xs text-muted-foreground">Expected</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Monthly Detail</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase">Period</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Inflow</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Outflow</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Net</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Projected</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-right">Cumulative</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.monthly.map((m) => {
                const isFuture = m.month > currentMonth;
                return (
                  <TableRow key={m.month} className={isFuture ? "opacity-60" : ""}>
                    <TableCell className="font-medium text-sm">
                      {formatMonth(m.month)}
                      {m.month === currentMonth && <span className="ml-1.5 text-xs text-blue-600">(current)</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-emerald-600">
                      {m.inflow > 0 ? formatCurrency(m.inflow) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-red-600">
                      {m.outflow > 0 ? formatCurrency(m.outflow) : "—"}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums text-sm font-medium ${m.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(m.net)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-blue-600">
                      {m.projectedInflow > 0 ? formatCurrency(m.projectedInflow) : "—"}
                    </TableCell>
                    <TableCell className={`text-right tabular-nums text-sm font-medium ${m.cumulativeBalance >= 0 ? "" : "text-red-600"}`}>
                      {formatCurrency(m.cumulativeBalance)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
