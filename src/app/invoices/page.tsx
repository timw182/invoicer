import { prisma } from "@/lib/db";
import { InvoiceListClient } from "@/components/invoices/invoice-list-client";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: { client: true },
    orderBy: { issueDate: "desc" },
  });

  return <InvoiceListClient invoices={JSON.parse(JSON.stringify(invoices))} />;
}
