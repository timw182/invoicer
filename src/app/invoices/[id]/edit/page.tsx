import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!invoice) {
    notFound();
  }

  if (invoice.status !== "draft") {
    redirect(`/invoices/${id}`);
  }

  const [clients, services, businessProfile] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.businessProfile.findFirst(),
  ]);

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Edit Invoice" />
        <p className="text-muted-foreground">
          Please set up your business profile before editing invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit Invoice ${invoice.invoiceNumber}`} />
      <InvoiceForm
        clients={JSON.parse(JSON.stringify(clients))}
        services={JSON.parse(JSON.stringify(services))}
        businessProfile={JSON.parse(JSON.stringify(businessProfile))}
        initialData={JSON.parse(JSON.stringify(invoice))}
      />
    </div>
  );
}
