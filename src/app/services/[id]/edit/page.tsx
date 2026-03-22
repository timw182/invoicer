import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/components/services/service-form";
import { useTranslations } from "next-intl";

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    notFound();
  }

  const t = useTranslations("services");

  return (
    <div className="space-y-6">
      <PageHeader title={t("editService")} />
      <ServiceForm
        initialData={{
          id: service.id,
          name: service.name,
          description: service.description ?? "",
          unitPrice: service.unitPrice,
          unit: service.unit as "hour" | "piece" | "project" | "day" | "flat",
          taxRate: service.taxRate,
        }}
      />
    </div>
  );
}
