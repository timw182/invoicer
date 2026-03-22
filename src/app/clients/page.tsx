import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientTable } from "@/components/clients/client-table";
import { getTranslations } from "next-intl/server";

export default async function ClientsPage() {
  const t = await getTranslations("clients");

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        action={
          <Button asChild>
            <Link href="/clients/new">{t("addClient")}</Link>
          </Button>
        }
      />
      <ClientTable clients={clients} />
    </div>
  );
}
