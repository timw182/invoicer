"use client";

import { DollarSign, Clock, AlertCircle, FileText, TrendingUp, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface StatsCardsProps {
  stats: {
    totalRevenue: number;
    outstanding: number;
    overdue: number;
    overdueCount: number;
    totalInvoices: number;
    income: number;
    totalBalance: number;
  };
}

interface StatCard {
  key: "totalBalance" | "income" | "outstanding" | "overdue" | "totalRevenue" | "totalInvoices";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  href: string;
  adminOnly?: boolean;
}

const cards: StatCard[] = [
  {
    key: "totalBalance",
    label: "Total Balance",
    icon: Landmark,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    href: "/accounts",
    adminOnly: true,
  },
  {
    key: "income",
    label: "Income",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-50",
    href: "/transactions",
    adminOnly: true,
  },
  {
    key: "outstanding",
    label: "Outstanding",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
    href: "/invoices?status=sent",
    adminOnly: true,
  },
  {
    key: "overdue",
    label: "Overdue",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    href: "/invoices?status=overdue",
    adminOnly: true,
  },
  {
    key: "totalRevenue",
    label: "Total Revenue",
    icon: DollarSign,
    color: "text-violet-600",
    bg: "bg-violet-50",
    href: "/invoices?status=paid",
    adminOnly: true,
  },
  {
    key: "totalInvoices",
    label: "Total Invoices",
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-50",
    href: "/invoices",
    adminOnly: true,
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const visibleCards = cards.filter((c) => !c.adminOnly || isAdmin);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {visibleCards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];
        const isCurrency = card.key !== "totalInvoices";

        return (
          <a key={card.key} href={card.href} className="block">
            <Card className="overflow-hidden hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </span>
                  <div className={cn("rounded-lg p-2", card.bg)}>
                    <Icon className={cn("h-4 w-4", card.color)} />
                  </div>
                </div>
                <div className={cn("text-2xl font-bold tabular-nums", card.color)}>
                  {isCurrency ? formatCurrency(value) : value}
                </div>
                {card.key === "overdue" && stats.overdueCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.overdueCount} invoice{stats.overdueCount !== 1 ? "s" : ""} overdue
                  </p>
                )}
              </CardContent>
            </Card>
          </a>
        );
      })}
    </div>
  );
}
