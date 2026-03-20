import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ClientTable } from "@/components/clients/client-table";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        action={
          <Button asChild>
            <Link href="/clients/new">Add Client</Link>
          </Button>
        }
      />
      <ClientTable clients={clients} />
    </div>
  );
}
