import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/clients/client-form";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
  });

  if (!client) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Client" />
      <ClientForm
        initialData={{
          id: client.id,
          name: client.name,
          email: client.email ?? "",
          address: client.address,
          country: client.country,
          taxId: client.taxId ?? "",
          phone: client.phone ?? "",
          notes: client.notes ?? "",
        }}
      />
    </div>
  );
}
