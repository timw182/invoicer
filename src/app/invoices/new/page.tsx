import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { useTranslations } from "next-intl";

export default async function NewInvoicePage() {
  const [clients, services, businessProfile] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.businessProfile.findFirst(),
  ]);

  const t = useTranslations("invoices");

  if (!businessProfile) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("newInvoice")} />
        <p className="text-muted-foreground">
          {t("setupProfile")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("newInvoice")} />
      <InvoiceForm
        clients={JSON.parse(JSON.stringify(clients))}
        services={JSON.parse(JSON.stringify(services))}
        businessProfile={JSON.parse(JSON.stringify(businessProfile))}
      />
    </div>
  );
}
