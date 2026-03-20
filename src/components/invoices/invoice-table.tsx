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

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  total: number;
  currency: string;
  client: {
    id: string;
    name: string;
  };
}

interface InvoiceTableProps {
  invoices: InvoiceWithClient[];
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice Number</TableHead>
          <TableHead>Client Name</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No invoices found.
            </TableCell>
          </TableRow>
        ) : (
          invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer"
              onClick={() => router.push(`/invoices/${invoice.id}`)}
            >
              <TableCell className="font-medium">
                {invoice.invoiceNumber}
              </TableCell>
              <TableCell>{invoice.client.name}</TableCell>
              <TableCell>{formatDate(invoice.issueDate)}</TableCell>
              <TableCell>{formatDate(invoice.dueDate)}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(invoice.total, invoice.currency)}
              </TableCell>
              <TableCell>
                <StatusBadge status={invoice.status} />
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
