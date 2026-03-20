import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/invoices/status-badge";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { FileText } from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  status: string;
  dueDate: string;
}

interface OverdueListProps {
  invoices: Invoice[];
}

export function OverdueList({ invoices }: OverdueListProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No invoices yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create your first invoice to get started
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Number</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Client</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Amount</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
          <TableHead className="text-xs font-semibold uppercase tracking-wider">Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id} className="group">
            <TableCell>
              <Link
                href={`/invoices/${invoice.id}`}
                className="font-mono text-sm font-medium text-primary hover:underline"
              >
                {invoice.invoiceNumber}
              </Link>
            </TableCell>
            <TableCell className="text-sm">{invoice.clientName}</TableCell>
            <TableCell className="text-sm text-right tabular-nums font-medium">
              {formatCurrency(invoice.total)}
            </TableCell>
            <TableCell>
              <StatusBadge status={invoice.status} />
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(invoice.dueDate)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
