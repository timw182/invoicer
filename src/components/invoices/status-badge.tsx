"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-50 text-gray-500 border-gray-200",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations("invoices.status");
  const style = statusStyles[status] || statusStyles.draft;
  const label = t(status as "draft" | "sent" | "paid" | "overdue" | "cancelled");
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize", style)}
    >
      {label}
    </Badge>
  );
}
