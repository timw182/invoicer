"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update status");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete invoice");
      }

      router.push("/invoices");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status === "draft" && (
        <>
          <Link href={`/invoices/${invoiceId}/edit`}>
            <Button variant="outline" disabled={loading}>
              Edit
            </Button>
          </Link>
          <Button
            variant="default"
            disabled={loading}
            onClick={() => updateStatus("sent")}
          >
            Mark as Sent
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </>
      )}

      {status === "sent" && (
        <>
          <Button
            disabled={loading}
            onClick={() => updateStatus("paid")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Mark as Paid
          </Button>
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => updateStatus("cancelled")}
          >
            Mark as Cancelled
          </Button>
        </>
      )}

      {status === "overdue" && (
        <Button
          disabled={loading}
          onClick={() => updateStatus("paid")}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Mark as Paid
        </Button>
      )}

      <Link href={`/api/invoices/${invoiceId}/pdf`}>
        <Button variant="outline">Download PDF</Button>
      </Link>
    </div>
  );
}
