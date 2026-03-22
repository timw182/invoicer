"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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

const tabKeys = ["all", "draft", "sent", "paid", "overdue"] as const;

export function InvoiceListClient({ invoices }: InvoiceListClientProps) {
  const [activeTab, setActiveTab] = useState("all");
  const t = useTranslations("invoices");

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
        title={t("title")}
        action={
          <Link href="/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("newInvoice")}
            </Button>
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabKeys.map((key) => (
            <TabsTrigger key={key} value={key}>
              {t(`tabs.${key}`)}
              {counts[key] > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {counts[key]}
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
