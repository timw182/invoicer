import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ServiceTable } from "@/components/services/service-table";
import { useTranslations } from "next-intl";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  const t = useTranslations("services");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        action={
          <Button asChild>
            <Link href="/services/new">{t("addService")}</Link>
          </Button>
        }
      />
      <ServiceTable services={services} />
    </div>
  );
}
