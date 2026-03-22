"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Pencil, Send, CheckCircle, XCircle, Trash2, Download, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface InvoiceActionsProps {
  invoiceId: string;
  status: string;
}

export function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const t = useTranslations("invoices");
  const tc = useTranslations("common");

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
    if (!confirm(t("deleteConfirm"))) return;
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

  async function handleReminder() {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/reminder`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send reminder");
      }
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="print-hide flex items-center gap-2 flex-wrap">
      {status === "draft" && (
        <>
          <Link href={`/invoices/${invoiceId}/edit`}>
            <Button variant="outline" size="sm" disabled={loading}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {t("actions.edit")}
            </Button>
          </Link>
          <Button
            size="sm"
            disabled={loading}
            onClick={() => updateStatus("sent")}
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            {t("actions.markAsSent")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={loading}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {tc("delete")}
          </Button>
        </>
      )}

      {status === "sent" && (
        <>
          {isAdmin && (
            <Button
              size="sm"
              disabled={loading}
              onClick={() => updateStatus("paid")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              {t("actions.markAsPaid")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleReminder}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            {t("actions.sendReminder")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => updateStatus("cancelled")}
          >
            <XCircle className="h-3.5 w-3.5 mr-1.5" />
            {t("actions.cancel")}
          </Button>
        </>
      )}

      {status === "overdue" && (
        <>
          {isAdmin && (
            <Button
              size="sm"
              disabled={loading}
              onClick={() => updateStatus("paid")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
              {t("actions.markAsPaid")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleReminder}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            {t("actions.sendReminder")}
          </Button>
        </>
      )}

      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Download className="h-3.5 w-3.5 mr-1.5" />
        {t("actions.pdf")}
      </Button>
    </div>
  );
}
