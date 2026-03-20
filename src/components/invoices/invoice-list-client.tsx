"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InvoiceTable } from "@/components/invoices/invoice-table";

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  total: number;
  currency: string;
  client: {
    id: string;
    name: string;
  };
}

interface InvoiceListClientProps {
  invoices: InvoiceWithClient[];
}

export function InvoiceListClient({ invoices }: InvoiceListClientProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredInvoices =
    activeTab === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        action={
          <Link href="/invoices/new">
            <Button>New Invoice</Button>
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab}>
          <InvoiceTable invoices={filteredInvoices} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
