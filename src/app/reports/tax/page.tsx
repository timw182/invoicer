"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";

interface TaxMonth {
  month: string;
  outputVat: number;
  inputVat: number;
  netVat: number;
  incomeNet: number;
  expenseNet: number;
}

interface TaxReport {
  totalOutputVat: number;
  totalInputVat: number;
  netVatLiability: number;
  monthly: TaxMonth[];
}

export default function TaxReportPage() {
  const t = useTranslations("reports");
  const tc = useTranslations("common");
  const [report, setReport] = useState<TaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const year = new Date().getFullYear();
  const [fromDate, setFromDate] = useState(`${year}-01-01`);
  const [toDate, setToDate] = useState(`${year}-12-31`);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/tax-summary?from=${fromDate}&to=${toDate}`)
      .then((r) => r.json())
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  function formatMonth(m: string) {
    const [y, mo] = m.split("-");
    return `${t(`months.${mo}`)} ${y}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("taxReport.title")} description={t("taxReport.description")} />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{tc("from")}</span>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">{tc("to")}</span>
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
                <p className="text-xs font-medium text-muted-foreground uppercase">{t("taxReport.outputVat")}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(report.totalOutputVat)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">{t("taxReport.inputVat")}</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(report.totalInputVat)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase">{t("taxReport.netVatLiability")}</p>
                <p className={`text-2xl font-bold mt-1 ${report.netVatLiability >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(Math.abs(report.netVatLiability))}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    {report.netVatLiability >= 0 ? t("taxReport.toPay") : t("taxReport.refund")}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>{t("taxReport.monthlyBreakdown")}</CardTitle></CardHeader>
            <CardContent>
              {report.monthly.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">{t("taxReport.noTransactions")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("taxReport.period")}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">{t("taxReport.netIncome")}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">{t("taxReport.outputVat")}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">{t("taxReport.netExpenses")}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">{t("taxReport.inputVat")}</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">{t("taxReport.netVatLiability")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.monthly.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="text-sm font-medium">{formatMonth(m.month)}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{formatCurrency(m.incomeNet)}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{formatCurrency(m.outputVat)}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{formatCurrency(m.expenseNet)}</TableCell>
                        <TableCell className="text-sm text-right tabular-nums">{formatCurrency(m.inputVat)}</TableCell>
                        <TableCell className={`text-sm text-right tabular-nums font-medium ${m.netVat >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {formatCurrency(Math.abs(m.netVat))}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell>{tc("total")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(report.monthly.reduce((s, m) => s + m.incomeNet, 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(report.totalOutputVat)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(report.monthly.reduce((s, m) => s + m.expenseNet, 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(report.totalInputVat)}</TableCell>
                      <TableCell className={`text-right tabular-nums ${report.netVatLiability >= 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatCurrency(Math.abs(report.netVatLiability))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
