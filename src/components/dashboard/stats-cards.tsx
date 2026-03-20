"use client";

import { DollarSign, Clock, AlertCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    totalRevenue: number;
    outstanding: number;
    overdue: number;
    overdueCount: number;
    totalInvoices: number;
  };
}

const cards = [
  {
    key: "totalRevenue" as const,
    label: "Total Revenue",
    icon: DollarSign,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    key: "outstanding" as const,
    label: "Outstanding",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "overdue" as const,
    label: "Overdue",
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    key: "totalInvoices" as const,
    label: "Total Invoices",
    icon: FileText,
    color: "text-slate-600",
    bg: "bg-slate-50",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = stats[card.key];
        const isCurrency = card.key !== "totalInvoices";

        return (
          <Card key={card.key} className="overflow-hidden">
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
        );
      })}
    </div>
  );
}
