import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ServiceTable } from "@/components/services/service-table";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        action={
          <Button asChild>
            <Link href="/services/new">Add Service</Link>
          </Button>
        }
      />
      <ServiceTable services={services} />
    </div>
  );
}
