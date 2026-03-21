import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { RecurringForm } from "@/components/recurring/recurring-form";

interface EditRecurringPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecurringPage({ params }: EditRecurringPageProps) {
  const { id } = await params;

  const [recurring, clients, services] = await Promise.all([
    prisma.recurringInvoice.findUnique({
      where: { id },
      include: { lineItems: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ]);

  if (!recurring) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Recurring Invoice" />
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
        initialData={{
          id: recurring.id,
          name: recurring.name,
          clientId: recurring.clientId,
          frequency: recurring.frequency,
          startDate: recurring.startDate,
          endDate: recurring.endDate,
          currency: recurring.currency,
          paymentTermDays: recurring.paymentTermDays,
          notes: recurring.notes,
          autoSend: recurring.autoSend,
          lineItems: recurring.lineItems.map((li) => ({
            serviceId: li.serviceId,
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            discount: li.discount,
            taxRate: li.taxRate,
          })),
        }}
      />
    </div>
  );
}
