"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { format, parse } from "date-fns";
import { TrendingUp, TrendingDown, Clock, CheckCircle, FileText, DollarSign } from "lucide-react";

interface KpiData {
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  avgDSO: number;
  collectionRate: number;
  avgInvoiceValue: number;
  thisMonthCount: number;
  lastMonthCount: number;
  monthlyInvoiceCounts: Array<{ month: string; count: number }>;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
}

interface KpiSectionProps {
  kpi: KpiData;
  monthlyRevenue: MonthlyRevenue[];
}

function formatMonth(monthStr: string): string {
  try {
    return format(parse(monthStr, "yyyy-MM", new Date()), "MMM");
  } catch {
    return monthStr;
  }
}

function MiniBar({ values, color, height = 48 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm transition-all"
          style={{
            height: `${Math.max(2, (v / max) * 100)}%`,
            backgroundColor: color,
            opacity: i === values.length - 1 ? 1 : 0.5 + (i / values.length) * 0.5,
          }}
        />
      ))}
    </div>
  );
}

function SparkLine({ values, color, height = 48 }: { values: number[]; color: string; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on last point */}
      {(() => {
        const lastX = w;
        const lastY = height - ((values[values.length - 1] - min) / range) * (height - 4) - 2;
        return <circle cx={lastX} cy={lastY} r="3" fill={color} />;
      })()}
    </svg>
  );
}

function GrowthIndicator({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">No change</span>;
  const isPositive = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : ""}{value}%
    </span>
  );
}

function CircularProgress({ value, size = 56, strokeWidth = 5, color }: { value: number; size?: number; strokeWidth?: number; color: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
    </svg>
  );
}

export function KpiSection({ kpi, monthlyRevenue }: KpiSectionProps) {
  const revenueValues = monthlyRevenue.map((m) => m.revenue);
  const invoiceCountValues = kpi.monthlyInvoiceCounts.map((m) => m.count);
  const revenueLabels = monthlyRevenue.map((m) => formatMonth(m.month));

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Key Performance Indicators</h2>

      {/* Revenue trend chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
            <GrowthIndicator value={kpi.revenueGrowth} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <span className="text-2xl font-bold">{formatCurrency(kpi.thisMonthRevenue)}</span>
            <span className="text-sm text-muted-foreground ml-2">this month</span>
          </div>
          <div style={{ height: 80 }}>
            <MiniBar values={revenueValues} color="#10b981" height={80} />
          </div>
          <div className="flex justify-between mt-1">
            {revenueLabels.map((label, i) => (
              <span key={i} className={`text-[9px] tabular-nums ${i === revenueLabels.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {i % 2 === 0 || i === revenueLabels.length - 1 ? label : ""}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* DSO */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Days to Pay</p>
                <p className="text-2xl font-bold mt-1">{kpi.avgDSO}<span className="text-sm font-normal text-muted-foreground ml-0.5">d</span></p>
                <p className="text-xs text-muted-foreground">DSO</p>
              </div>
              <div className="rounded-lg p-2 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Collection Rate</p>
                <p className="text-2xl font-bold mt-1">{kpi.collectionRate}<span className="text-sm font-normal text-muted-foreground ml-0.5">%</span></p>
                <p className="text-xs text-muted-foreground">paid vs overdue</p>
              </div>
              <div className="relative flex items-center justify-center">
                <CircularProgress value={kpi.collectionRate} color={kpi.collectionRate >= 80 ? "#10b981" : kpi.collectionRate >= 60 ? "#f59e0b" : "#ef4444"} />
                <CheckCircle className="h-4 w-4 absolute text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Invoice Value */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Avg Invoice</p>
                <p className="text-xl font-bold mt-1">{formatCurrency(kpi.avgInvoiceValue)}</p>
                <p className="text-xs text-muted-foreground">per invoice</p>
              </div>
              <div className="rounded-lg p-2 bg-violet-50">
                <DollarSign className="h-4 w-4 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Volume */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Invoices This Month</p>
                <p className="text-2xl font-bold mt-1">{kpi.thisMonthCount}</p>
                <p className="text-xs text-muted-foreground">
                  {kpi.lastMonthCount > 0 ? (
                    kpi.thisMonthCount >= kpi.lastMonthCount
                      ? `+${kpi.thisMonthCount - kpi.lastMonthCount} vs last month`
                      : `${kpi.thisMonthCount - kpi.lastMonthCount} vs last month`
                  ) : "first month"}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-slate-50">
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
            </div>
            <div className="mt-3">
              <SparkLine values={invoiceCountValues} color="#6366f1" height={28} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
