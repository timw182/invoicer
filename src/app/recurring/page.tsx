"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RecurringTable } from "@/components/recurring/recurring-table";
import { Plus } from "lucide-react";

export default function RecurringPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/recurring");
      if (res.ok) setItems(await res.json());
    } catch (error) {
      console.error("Failed to fetch recurring invoices:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Recurring Invoices" />
        <Card><CardContent className="p-5"><div className="h-64 animate-pulse rounded bg-muted" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Invoices"
        description="Automate invoice generation for subscriptions and retainers"
        action={
          <Link href="/recurring/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        }
      />
      <Card>
        <CardContent className="p-0">
          <RecurringTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}
