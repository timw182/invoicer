import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-50 text-gray-500 border-gray-200",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize", config.className)}
    >
      {config.label}
    </Badge>
  );
}
