"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";

interface ClientData {
  clientId: string;
  clientName: string;
  email: string | null;
  country: string;
  totalInvoices: number;
  paidCount: number;
  outstandingCount: number;
  overdueCount: number;
  totalRevenue: number;
  totalOutstanding: number;
  avgDaysToPayment: number | null;
  medianDaysToPayment: number | null;
  onTimeRate: number | null;
  latePaymentCount: number;
  avgLateDays: number;
}

interface ClientReport {
  totalClients: number;
  avgDSO: number;
  topRevenue: ClientData[];
  latePayers: ClientData[];
  clients: ClientData[];
}

function ratingBadge(onTimeRate: number | null) {
  if (onTimeRate === null) return <Badge variant="secondary" className="text-xs">N/A</Badge>;
  if (onTimeRate >= 90) return <Badge className="bg-emerald-100 text-emerald-700 text-xs">Excellent</Badge>;
  if (onTimeRate >= 70) return <Badge className="bg-amber-100 text-amber-700 text-xs">Good</Badge>;
  if (onTimeRate >= 50) return <Badge className="bg-orange-100 text-orange-700 text-xs">Fair</Badge>;
  return <Badge className="bg-red-100 text-red-700 text-xs">Poor</Badge>;
}

export default function ClientAnalysisPage() {
  const [report, setReport] = useState<ClientReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/clients")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client Analysis" description="Payment behavior and revenue by client" />
        <Card><CardContent className="p-5"><div className="h-48 animate-pulse rounded bg-muted" /></CardContent></Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title="Client Analysis" description="Payment behavior and revenue by client" />
        <Card><CardContent className="p-8 text-center text-muted-foreground">Failed to load report.</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Client Analysis" description="Payment behavior and revenue by client" />

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Active Clients</p>
            <p className="text-2xl font-bold mt-1">{report.totalClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Avg Days to Payment</p>
            <p className="text-2xl font-bold mt-1">{report.avgDSO > 0 ? `${report.avgDSO}d` : "—"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">DSO (Days Sales Outstanding)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Top Revenue Client</p>
            <p className="text-lg font-bold mt-1 truncate">{report.topRevenue[0]?.clientName || "—"}</p>
            {report.topRevenue[0] && (
              <p className="text-sm text-emerald-600 font-medium">{formatCurrency(report.topRevenue[0].totalRevenue)}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">Late Payers</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{report.latePayers.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Below 70% on-time rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Late Payers Alert */}
      {report.latePayers.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base text-amber-700">Clients with Late Payment Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.latePayers.map((c) => (
                <div key={c.clientId} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                  <div>
                    <Link href={`/clients/${c.clientId}`} className="font-medium text-sm hover:underline">{c.clientName}</Link>
                    <p className="text-xs text-muted-foreground">{c.latePaymentCount} late payment{c.latePaymentCount !== 1 ? "s" : ""}, avg {c.avgLateDays}d late</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-amber-700">{c.onTimeRate}% on-time</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Client Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">All Clients</CardTitle></CardHeader>
        <CardContent>
          {report.clients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No clients with invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase">Client</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Invoices</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Revenue</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Outstanding</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">Avg Days to Pay</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">On-Time %</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-center">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.clients.map((c) => (
                  <TableRow key={c.clientId}>
                    <TableCell>
                      <Link href={`/clients/${c.clientId}`} className="font-medium text-sm hover:underline">{c.clientName}</Link>
                      <p className="text-xs text-muted-foreground">{c.country}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {c.totalInvoices}
                      {c.overdueCount > 0 && (
                        <span className="text-red-600 ml-1">({c.overdueCount} overdue)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm font-medium text-emerald-600">
                      {formatCurrency(c.totalRevenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {c.totalOutstanding > 0 ? (
                        <span className="text-amber-600 font-medium">{formatCurrency(c.totalOutstanding)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {c.avgDaysToPayment !== null ? (
                        <span className={c.avgDaysToPayment > 30 ? "text-amber-600" : ""}>{c.avgDaysToPayment}d</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {c.onTimeRate !== null ? (
                        <span className={c.onTimeRate < 70 ? "text-red-600 font-medium" : c.onTimeRate >= 90 ? "text-emerald-600" : ""}>
                          {c.onTimeRate}%
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-center">{ratingBadge(c.onTimeRate)}</TableCell>
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
