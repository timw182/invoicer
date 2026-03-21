import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { RecurringForm } from "@/components/recurring/recurring-form";

export default async function NewRecurringPage() {
  const [clients, services] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Recurring Invoice" description="Create an automated invoice template" />
      <RecurringForm
        clients={clients.map((c) => ({ id: c.id, name: c.name }))}
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          unitPrice: s.unitPrice,
          unit: s.unit,
          taxRate: s.taxRate,
        }))}
      />
    </div>
  );
}
