import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      invoices: {
        orderBy: { issueDate: "desc" },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Calculate stats
  const totalInvoiced = client.invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = client.invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.total, 0);
  const outstanding = client.invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdue = client.invoices
    .filter((inv) => inv.status === "overdue")
    .reduce((sum, inv) => sum + inv.total, 0);

  const currency = client.invoices[0]?.currency || "EUR";

  function statusVariant(status: string) {
    switch (status) {
      case "paid": return "default" as const;
      case "overdue": return "destructive" as const;
      case "sent": return "secondary" as const;
      case "cancelled": return "outline" as const;
      default: return "secondary" as const;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={client.contactPerson ? `Contact: ${client.contactPerson}` : undefined}
        action={
          <Button asChild>
            <Link href={`/clients/${client.id}/edit`}>Edit Client</Link>
          </Button>
        }
      />

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Invoiced</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalInvoiced, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{client.invoices.length} invoice{client.invoices.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(totalPaid, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{client.invoices.filter((i) => i.status === "paid").length} paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(outstanding, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{client.invoices.filter((i) => i.status === "sent").length} sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(overdue, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{client.invoices.filter((i) => i.status === "overdue").length} overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {client.contactPerson && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Person</dt>
                  <dd className="text-sm mt-0.5">{client.contactPerson}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</dt>
                <dd className="text-sm mt-0.5">{client.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</dt>
                <dd className="text-sm mt-0.5">{client.phone || "—"}</dd>
              </div>
              {client.website && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Website</dt>
                  <dd className="text-sm mt-0.5">{client.website}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address & Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</dt>
                <dd className="text-sm mt-0.5 whitespace-pre-line">{client.address}</dd>
              </div>
              {client.billingAddress && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Billing Address</dt>
                  <dd className="text-sm mt-0.5 whitespace-pre-line">{client.billingAddress}</dd>
                </div>
              )}
              <Separator />
              <div className="flex gap-8">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Country</dt>
                  <dd className="mt-0.5">
                    <Badge variant="secondary">{client.country}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">VAT Number</dt>
                  <dd className="text-sm mt-0.5 font-mono">{client.taxId || "—"}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Invoice & Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoice & Payment History</CardTitle>
          <Button asChild size="sm">
            <Link href={`/invoices/new?clientId=${client.id}`}>New Invoice</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {client.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No invoices yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="font-medium font-mono text-sm hover:underline"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.issueDate)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
