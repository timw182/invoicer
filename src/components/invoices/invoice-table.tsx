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
import { StatusBadge } from "@/components/invoices/status-badge";
import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { FileText } from "lucide-react";
import { differenceInDays } from "date-fns";

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  paidAt?: string | Date | null;
  total: number;
  currency: string;
  client: { id: string; name: string };
}

interface InvoiceTableProps {
  invoices: InvoiceWithClient[];
}

function DueInfo({ status, dueDate }: { status: string; dueDate: string | Date }) {
  const t = useTranslations("invoices.table");
  const due = new Date(dueDate);
  const now = new Date();
  const daysOverdue = differenceInDays(now, due);

  if (status === "overdue") {
    return (
      <div>
        <span className="text-sm">{formatDate(dueDate)}</span>
        <span className="block text-xs font-medium text-red-600">
          {t("dOverdue", { days: daysOverdue })}
        </span>
      </div>
    );
  }

  if (status === "sent" && daysOverdue >= -3 && daysOverdue < 0) {
    return (
      <div>
        <span className="text-sm">{formatDate(dueDate)}</span>
        <span className="block text-xs font-medium text-amber-600">
          {t("dueInD", { days: Math.abs(daysOverdue) })}
        </span>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <span className="text-sm text-muted-foreground">{formatDate(dueDate)}</span>
    );
  }

  return <span className="text-sm text-muted-foreground">{formatDate(dueDate)}</span>;
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();
  const t = useTranslations("invoices");

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t("noInvoices")}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("table.number")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("table.client")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("table.issued")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("table.due")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">{t("table.total")}</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">{t("table.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow
            key={invoice.id}
            className={`cursor-pointer group ${
              invoice.status === "overdue" ? "bg-red-50/50" : ""
            }`}
            onClick={() => router.push(`/invoices/${invoice.id}`)}
          >
            <TableCell className="font-mono text-sm font-medium text-primary">
              {invoice.invoiceNumber}
            </TableCell>
            <TableCell className="text-sm">{invoice.client.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(invoice.issueDate)}
            </TableCell>
            <TableCell>
              <DueInfo status={invoice.status} dueDate={invoice.dueDate} />
            </TableCell>
            <TableCell className="text-sm text-right tabular-nums font-medium">
              {formatCurrency(invoice.total, invoice.currency)}
            </TableCell>
            <TableCell>
              <StatusBadge status={invoice.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
