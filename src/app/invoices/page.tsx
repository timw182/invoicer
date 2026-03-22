"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

interface InvoiceWithClient {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  paidAt: string | Date | null;
  total: number;
  currency: string;
  client: { id: string; name: string };
}

const POLL_INTERVAL = 15000;

export default function InvoicesPage() {
  const t = useTranslations("invoices");
  const tc = useTranslations("common");

  const tabs = [
    { value: "all", label: t("tabs.all") },
    { value: "draft", label: t("tabs.draft") },
    { value: "sent", label: t("tabs.sent") },
    { value: "overdue", label: t("tabs.overdue") },
    { value: "paid", label: t("tabs.paid") },
    { value: "cancelled", label: t("tabs.cancelled") },
  ];

  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchInvoices = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    const interval = setInterval(() => fetchInvoices(), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchInvoices]);

  const filteredInvoices =
    activeTab === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === activeTab);

  const counts: Record<string, number> = {
    all: invoices.length,
    draft: invoices.filter((i) => i.status === "draft").length,
    sent: invoices.filter((i) => i.status === "sent").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    cancelled: invoices.filter((i) => i.status === "cancelled").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} />
        <Card>
          <CardContent className="p-5">
            <div className="h-64 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchInvoices(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
              {tc("refresh")}
            </Button>
            <Link href="/invoices/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("newInvoice")}
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                  tab.value === "overdue" && counts[tab.value] > 0
                    ? "bg-red-100 text-red-700"
                    : "text-muted-foreground"
                }`}>
                  {counts[tab.value]}
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
