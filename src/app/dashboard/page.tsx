"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { OverdueList } from "@/components/dashboard/overdue-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/invoices/status-badge";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { Plus, RefreshCw, AlertTriangle, Repeat } from "lucide-react";
import { differenceInDays } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { KpiSection } from "@/components/dashboard/kpi-section";

interface ActionNeededInvoice {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
  clientName: string;
  client: { id: string; name: string };
  reminders: Array<{ sentAt: string; type: string }>;
}

interface UpcomingRecurring {
  id: string;
  name: string;
  nextGenerateAt: string;
  frequency: string;
  client: { id: string; name: string };
}

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

interface DashboardStats {
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  totalInvoices: number;
  income: number;
  totalBalance: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    status: string;
    dueDate: string;
  }>;
  actionNeeded: ActionNeededInvoice[];
  upcomingRecurring: UpcomingRecurring[];
  kpi: KpiData;
}

const POLL_INTERVAL = 30000;

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your invoicing" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your invoicing" />
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Failed to load dashboard data. Please try refreshing.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your invoicing"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {lastUpdated && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStats(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Link href="/invoices/new">
              <Button size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Invoice</span>
              </Button>
            </Link>
          </div>
        }
      />
      <StatsCards stats={stats} />

      {/* KPI Section - Admin only */}
      {isAdmin && stats.kpi && (
        <KpiSection kpi={stats.kpi} monthlyRevenue={stats.monthlyRevenue} />
      )}

      {/* Action Needed */}
      {stats.actionNeeded && stats.actionNeeded.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-base font-semibold">Action Needed</CardTitle>
              <Badge variant="secondary" className="text-xs">{stats.actionNeeded.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.actionNeeded.map((inv) => {
                const daysOverdue = differenceInDays(new Date(), new Date(inv.dueDate));
                const lastReminder = inv.reminders?.[0];
                return (
                  <Link
                    key={inv.id}
                    href={`/invoices/${inv.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <StatusBadge status={inv.status} />
                      <div>
                        <span className="font-mono text-sm font-medium">{inv.invoiceNumber}</span>
                        <span className="text-sm text-muted-foreground ml-2">{inv.client.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {lastReminder && (
                        <span className="text-xs text-muted-foreground">
                          Reminded {formatDate(lastReminder.sentAt)}
                        </span>
                      )}
                      <span className={`font-medium ${daysOverdue > 0 ? "text-red-600" : "text-amber-600"}`}>
                        {daysOverdue > 0 ? `${daysOverdue}d overdue` : `Due in ${Math.abs(daysOverdue)}d`}
                      </span>
                      <span className="tabular-nums font-medium">{formatCurrency(inv.total, inv.currency)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Recurring - Admin only */}
      {isAdmin && stats.upcomingRecurring && stats.upcomingRecurring.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-base font-semibold">Upcoming Auto-Invoices</CardTitle>
              </div>
              <Link href="/recurring" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.upcomingRecurring.map((rec) => (
                <Link
                  key={rec.id}
                  href={`/recurring/${rec.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="text-sm font-medium">{rec.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">{rec.client.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs capitalize">{rec.frequency}</Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(rec.nextGenerateAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Invoices</CardTitle>
            <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <OverdueList invoices={stats.recentInvoices} />
        </CardContent>
      </Card>
    </div>
  );
}
