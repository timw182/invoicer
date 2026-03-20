"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { OverdueList } from "@/components/dashboard/overdue-list";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DashboardStats {
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  totalInvoices: number;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    status: string;
    dueDate: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your invoicing" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        }
      />
      <StatsCards stats={stats} />
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
