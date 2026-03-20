import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";

export default async function NewInvoicePage() {
  const [clients, services, businessProfile] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.businessProfile.findFirst(),
  ]);

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <PageHeader title="New Invoice" />
        <p className="text-muted-foreground">
          Please set up your business profile before creating invoices.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="New Invoice" />
      <InvoiceForm
        clients={JSON.parse(JSON.stringify(clients))}
        services={JSON.parse(JSON.stringify(services))}
        businessProfile={JSON.parse(JSON.stringify(businessProfile))}
      />
    </div>
  );
}
