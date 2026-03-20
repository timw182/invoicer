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
      <p className="text-muted-foreground text-sm py-6 text-center">
        No invoices yet
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice Number</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.id}>
            <TableCell>
              <Link
                href={`/invoices/${invoice.id}`}
                className="text-blue-600 hover:underline"
              >
                {invoice.invoiceNumber}
              </Link>
            </TableCell>
            <TableCell>{invoice.clientName}</TableCell>
            <TableCell>{formatCurrency(invoice.total)}</TableCell>
            <TableCell>
              <StatusBadge status={invoice.status} />
            </TableCell>
            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
