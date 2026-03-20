"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Send, CheckCircle, XCircle, Trash2, Download } from "lucide-react";

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
    <div className="flex items-center gap-2 flex-wrap">
      {status === "draft" && (
        <>
          <Link href={`/invoices/${invoiceId}/edit`}>
            <Button variant="outline" size="sm" disabled={loading}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          </Link>
          <Button
            size="sm"
            disabled={loading}
            onClick={() => updateStatus("sent")}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Mark as Sent
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </>
      )}

      {status === "sent" && (
        <>
          <Button
            size="sm"
            disabled={loading}
            onClick={() => updateStatus("paid")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Mark as Paid
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => updateStatus("cancelled")}
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            Cancel
          </Button>
        </>
      )}

      {status === "overdue" && (
        <Button
          size="sm"
          disabled={loading}
          onClick={() => updateStatus("paid")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Mark as Paid
        </Button>
      )}

      <Link href={`/api/invoices/${invoiceId}/pdf`}>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          PDF
        </Button>
      </Link>
    </div>
  );
}
