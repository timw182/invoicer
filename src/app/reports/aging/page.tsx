"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

interface AgingReport {
  totalOutstanding: number;
  totalCount: number;
  summary: Array<{
    bucket: string;
    label: string;
    count: number;
    total: number;
    percentage: number;
  }>;
  byClient: Array<{
    clientId: string;
    name: string;
    total: number;
    count: number;
    oldest: number;
  }>;
  details: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    currency: string;
    dueDate: string;
    daysOverdue: number;
    status: string;
  }>;
}

const bucketColors: Record<string, string> = {
  current: "bg-emerald-500",
  "1-30": "bg-amber-400",
  "31-60": "bg-orange-500",
  "61-90": "bg-red-500",
  "90+": "bg-red-800",
};

const bucketTextColors: Record<string, string> = {
  current: "text-emerald-600",
  "1-30": "text-amber-600",
  "31-60": "text-orange-600",
  "61-90": "text-red-600",
  "90+": "text-red-800",
};

export default function AgingReportPage() {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const [report, setReport] = useState<AgingReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/aging")
      .then((r) => (r.ok ? r.json() : null))
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("agingReport.title")} description={t("agingReport.description")} />
        <Card><CardContent className="p-5"><div className="h-48 animate-pulse rounded bg-muted" /></CardContent></Card>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("agingReport.title")} description={t("agingReport.description")} />
        <Card><CardContent className="p-8 text-center text-muted-foreground">{tc("failedToLoad")}</CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("agingReport.title")} description={t("agingReport.description")} />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">{t("agingReport.totalOutstanding")}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(report.totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase">{t("agingReport.unpaidInvoices")}</p>
            <p className="text-2xl font-bold mt-1">{report.totalCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Buckets */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t("agingReport.agingBreakdown")}</CardTitle></CardHeader>
        <CardContent>
          {report.totalCount === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{t("agingReport.noOutstanding")}</p>
          ) : (
            <>
              {/* Visual bar */}
              <div className="flex h-8 rounded-lg overflow-hidden mb-4">
                {report.summary.filter((s) => s.total > 0).map((s) => (
                  <div
                    key={s.bucket}
                    className={`${bucketColors[s.bucket]} flex items-center justify-center text-white text-xs font-medium`}
                    style={{ width: `${s.percentage}%`, minWidth: s.percentage > 0 ? "40px" : 0 }}
                  >
                    {s.percentage > 8 ? `${s.percentage}%` : ""}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-5 gap-3">
                {report.summary.map((s) => (
                  <div key={s.bucket} className="rounded-lg border p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-3 w-3 rounded-full ${bucketColors[s.bucket]}`} />
                      <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                    </div>
                    <p className={`text-lg font-bold tabular-nums ${bucketTextColors[s.bucket]}`}>
                      {formatCurrency(s.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.count !== 1
                        ? t("agingReport.invoices", { count: s.count })
                        : `${s.count} invoice`}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* By Client */}
      {report.byClient.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("agingReport.outstandingByClient")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase">{t("agingReport.client")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">{t("agingReport.invoices")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">{tc("total")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">{t("agingReport.oldest")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byClient.map((c) => (
                  <TableRow key={c.clientId}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.count}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(c.total)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={c.oldest > 30 ? "destructive" : "secondary"} className="text-xs">
                        {c.oldest > 0 ? t("agingReport.dOverdue", { days: c.oldest }) : t("agingReport.currentLabel")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invoice Details */}
      {report.details.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("agingReport.allOutstandingInvoices")}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase">{t("agingReport.invoice")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{t("agingReport.client")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase">{tc("date")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">{t("agingReport.daysOverdue")}</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-right">{tc("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.details.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-medium hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{inv.clientName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell className="text-right">
                      {inv.daysOverdue > 0 ? (
                        <span className={`text-sm font-medium ${inv.daysOverdue > 60 ? "text-red-700" : inv.daysOverdue > 30 ? "text-orange-600" : "text-amber-600"}`}>
                          {inv.daysOverdue}d
                        </span>
                      ) : (
                        <span className="text-sm text-emerald-600">{t("agingReport.currentLabel")}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(inv.total, inv.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
