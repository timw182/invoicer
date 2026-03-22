import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/invoices/status-badge";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import { frequencyLabel } from "@/lib/recurring";
import { getTranslations } from "next-intl/server";

interface RecurringDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RecurringDetailPage({ params }: RecurringDetailPageProps) {
  const t = await getTranslations("recurring");
  const tc = await getTranslations("common");
  const { id } = await params;

  const recurring = await prisma.recurringInvoice.findUnique({
    where: { id },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      generatedInvoices: {
        orderBy: { issueDate: "desc" },
      },
    },
  });

  if (!recurring) notFound();

  const estimatedNet = recurring.lineItems.reduce((sum, li) => {
    const net = li.quantity * li.unitPrice;
    const disc = net * ((li.discount ?? 0) / 100);
    return sum + (net - disc);
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={recurring.name}
        description={`${recurring.client.name} — ${frequencyLabel(recurring.frequency)}`}
        action={
          <div className="flex gap-2">
            <Link href={`/recurring/${recurring.id}/edit`}>
              <Button variant="outline">{t("editTemplate")}</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("frequency")}</p>
            <p className="text-lg font-bold mt-1">{frequencyLabel(recurring.frequency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("nextInvoice")}</p>
            <p className="text-lg font-bold mt-1">{formatDate(recurring.nextGenerateAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("estAmount")}</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(estimatedNet, recurring.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("generated")}</p>
            <p className="text-lg font-bold mt-1">{t("invoicesCount", { count: recurring.generatedCount })}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("templateDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tc("status")}</dt>
              <dd className="mt-1">
                <Badge variant={recurring.active ? "default" : "secondary"}>
                  {recurring.active ? tc("active") : tc("paused")}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("autoSend")}</dt>
              <dd className="mt-1">{recurring.autoSend ? tc("yes") : tc("no")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("startDate")}</dt>
              <dd className="mt-1">{formatDate(recurring.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("endDate")}</dt>
              <dd className="mt-1">{recurring.endDate ? formatDate(recurring.endDate) : t("indefinite")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("lineItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc("description")}</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurring.lineItems.map((li) => {
                const net = li.quantity * li.unitPrice * (1 - (li.discount ?? 0) / 100);
                return (
                  <TableRow key={li.id}>
                    <TableCell className="font-medium">{li.description}</TableCell>
                    <TableCell className="text-right tabular-nums">{li.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{li.unit}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(li.unitPrice, recurring.currency)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{li.taxRate}%</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(net, recurring.currency)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("generatedInvoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          {recurring.generatedInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("noInvoicesGenerated")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("issueDate")}</TableHead>
                  <TableHead>{t("dueDate")}</TableHead>
                  <TableHead>{tc("status")}</TableHead>
                  <TableHead className="text-right">{tc("total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurring.generatedInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link href={`/invoices/${inv.id}`} className="font-mono text-sm font-medium text-primary hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(inv.issueDate)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatCurrency(inv.total, inv.currency)}</TableCell>
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
