"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Plus } from "lucide-react";

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  total: number;
  currency: string;
  client: { id: string; name: string };
}

interface InvoiceListClientProps {
  invoices: InvoiceWithClient[];
}

const tabs = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

export function InvoiceListClient({ invoices }: InvoiceListClientProps) {
  const [activeTab, setActiveTab] = useState("all");

  const filteredInvoices =
    activeTab === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === activeTab);

  const counts = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        action={
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {counts[tab.value as keyof typeof counts] > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {counts[tab.value as keyof typeof counts]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab}>
          <Card>
            <CardContent className="p-0">
              <InvoiceTable invoices={filteredInvoices} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
