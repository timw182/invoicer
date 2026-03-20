import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">{status}</Badge>;
    case "sent":
      return <Badge variant="default">{status}</Badge>;
    case "paid":
      return (
        <Badge className="border-transparent bg-green-600 text-white hover:bg-green-600/80">
          {status}
        </Badge>
      );
    case "overdue":
      return <Badge variant="destructive">{status}</Badge>;
    case "cancelled":
      return <Badge variant="outline">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
