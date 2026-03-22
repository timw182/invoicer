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
import { getTranslations } from "next-intl/server";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const t = await getTranslations("clients");
  const tc = await getTranslations("common");
  const td = await getTranslations("dashboard");
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
        description={client.contactPerson ? t("contact", { name: client.contactPerson }) : undefined}
        action={
          <Button asChild>
            <Link href={`/clients/${client.id}/edit`}>{t("editClient")}</Link>
          </Button>
        }
      />

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("totalInvoiced")}</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalInvoiced, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{client.invoices.length !== 1 ? t("invoiceCountPlural", { count: client.invoices.length }) : t("invoiceCount", { count: client.invoices.length })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("paid")}</p>
            <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(totalPaid, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("paidCount", { count: client.invoices.filter((i) => i.status === "paid").length })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{td("outstanding")}</p>
            <p className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(outstanding, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("sentCount", { count: client.invoices.filter((i) => i.status === "sent").length })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{td("overdue")}</p>
            <p className="text-2xl font-bold mt-1 text-red-600">{formatCurrency(overdue, currency)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("overdueCount", { count: client.invoices.filter((i) => i.status === "overdue").length })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("contactDetails")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {client.contactPerson && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("contactPerson")}</dt>
                  <dd className="text-sm mt-0.5">{client.contactPerson}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tc("email")}</dt>
                <dd className="text-sm mt-0.5">{client.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tc("phone")}</dt>
                <dd className="text-sm mt-0.5">{client.phone || "—"}</dd>
              </div>
              {client.website && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("website")}</dt>
                  <dd className="text-sm mt-0.5">{client.website}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("addressAndTax")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tc("address")}</dt>
                <dd className="text-sm mt-0.5 whitespace-pre-line">{client.address}</dd>
              </div>
              {client.billingAddress && (
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("billingAddress")}</dt>
                  <dd className="text-sm mt-0.5 whitespace-pre-line">{client.billingAddress}</dd>
                </div>
              )}
              <Separator />
              <div className="flex gap-8">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tc("country")}</dt>
                  <dd className="mt-0.5">
                    <Badge variant="secondary">{client.country}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("vatNumber")}</dt>
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
            <CardTitle>{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-line text-muted-foreground">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Invoice & Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("invoicePaymentHistory")}</CardTitle>
          <Button asChild size="sm">
            <Link href={`/invoices/new?clientId=${client.id}`}>{td("newInvoice")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {client.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("noInvoicesYet")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("issueDate")}</TableHead>
                  <TableHead>{t("dueDate")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                  <TableHead>{t("paidAt")}</TableHead>
                  <TableHead className="text-right">{tc("total")}</TableHead>
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
