import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { StatusBadge } from "@/components/invoices/status-badge";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      client: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  const serializedInvoice = JSON.parse(JSON.stringify(invoice));

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.invoiceNumber}
        description={invoice.client.name}
        action={<StatusBadge status={invoice.status} />}
      />

      <InvoiceActions invoiceId={invoice.id} status={invoice.status} />

      <InvoicePreview invoice={serializedInvoice} />
    </div>
  );
}
