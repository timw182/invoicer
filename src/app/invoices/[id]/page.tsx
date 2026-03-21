import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { StatusBadge } from "@/components/invoices/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Bell } from "lucide-react";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

const reminderTypeLabels: Record<string, string> = {
  upcoming: "Due soon reminder",
  overdue: "Overdue notice",
  overdue_followup: "Overdue follow-up",
};

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  const [invoice, profile] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id },
      include: {
        lineItems: { orderBy: { sortOrder: "asc" } },
        client: true,
        reminders: { orderBy: { sentAt: "desc" } },
        recurringInvoice: { select: { id: true, name: true } },
      },
    }),
    prisma.businessProfile.findFirst(),
  ]);

  if (!invoice) {
    notFound();
  }

  const serializedInvoice = JSON.parse(JSON.stringify(invoice));

  const branding = {
    logoUrl: profile?.logoUrl || null,
    accentColor: profile?.accentColor || "#1e40af",
    bankName: profile?.bankName || null,
    bankIban: profile?.bankIban || null,
    bankBic: profile?.bankBic || null,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.client.name}
        action={<StatusBadge status={invoice.status} />}
      />

      <InvoiceActions invoiceId={invoice.id} status={invoice.status} />

      {/* Recurring source */}
      {invoice.recurringInvoice && (
        <div className="print-hide rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex items-center gap-2">
          Auto-generated from recurring template:{" "}
          <Link href={`/recurring/${invoice.recurringInvoice.id}`} className="font-medium underline">
            {invoice.recurringInvoice.name}
          </Link>
        </div>
      )}

      {/* Reminder History */}
      {invoice.reminders.length > 0 && (
        <Card className="print-hide">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Reminder History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoice.reminders.map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {reminderTypeLabels[reminder.type] || reminder.type}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">{formatDate(reminder.sentAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <InvoicePreview invoice={serializedInvoice} branding={branding} />
    </div>
  );
}
