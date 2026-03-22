import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { getTranslations } from "next-intl/server";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const t = await getTranslations("clients");
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("editClient")} />
      <ClientForm
        initialData={{
          id: client.id,
          name: client.name,
          contactPerson: client.contactPerson ?? "",
          email: client.email ?? "",
          address: client.address,
          billingAddress: client.billingAddress ?? "",
          country: client.country,
          taxId: client.taxId ?? "",
          phone: client.phone ?? "",
          website: client.website ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
