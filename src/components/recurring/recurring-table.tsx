"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { frequencyLabel } from "@/lib/recurring";
import { Repeat } from "lucide-react";

interface RecurringInvoice {
  id: string;
  name: string;
  frequency: string;
  nextGenerateAt: string | Date;
  active: boolean;
  autoSend: boolean;
  currency: string;
  generatedCount: number;
  lastGeneratedAt: string | Date | null;
  client: { id: string; name: string };
  lineItems: Array<{ unitPrice: number; quantity: number; discount: number }>;
}

interface RecurringTableProps {
  items: RecurringInvoice[];
}

function estimateTotal(lineItems: RecurringInvoice["lineItems"]): number {
  return lineItems.reduce((sum, li) => {
    const net = li.quantity * li.unitPrice;
    const disc = net * ((li.discount ?? 0) / 100);
    return sum + (net - disc);
  }, 0);
}

export function RecurringTable({ items }: RecurringTableProps) {
  const router = useRouter();
  const t = useTranslations("recurring");
  const tc = useTranslations("common");

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <Repeat className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t("noRecurring")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("createToAutomate")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{tc("name")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("client")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("frequency")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("nextDate")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">{t("estAmount")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("generated")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{tc("status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow
            key={item.id}
            className="cursor-pointer group"
            onClick={() => router.push(`/recurring/${item.id}`)}
          >
            <TableCell className="font-medium text-sm">{item.name}</TableCell>
            <TableCell className="text-sm">{item.client.name}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-xs">
                {frequencyLabel(item.frequency)}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(item.nextGenerateAt)}
            </TableCell>
            <TableCell className="text-sm text-right tabular-nums font-medium">
              {formatCurrency(estimateTotal(item.lineItems), item.currency)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {item.generatedCount}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={item.active ? "default" : "secondary"} className="text-xs">
                  {item.active ? tc("active") : tc("paused")}
                </Badge>
                {item.autoSend && (
                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                    {t("autoSendLabel")}
                  </Badge>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
