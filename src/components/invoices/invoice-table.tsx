"use client";

import { useRouter } from "next/navigation";
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

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  total: number;
  currency: string;
  client: { id: string; name: string };
}

interface InvoiceTableProps {
  invoices: InvoiceWithClient[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No invoices found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Number</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Client</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Issued</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Due</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Total</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow
            key={invoice.id}
            className="cursor-pointer group"
            onClick={() => router.push(`/invoices/${invoice.id}`)}
          >
            <TableCell className="font-mono text-sm font-medium text-primary">
              {invoice.invoiceNumber}
            </TableCell>
            <TableCell className="text-sm">{invoice.client.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(invoice.issueDate)}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(invoice.dueDate)}
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
