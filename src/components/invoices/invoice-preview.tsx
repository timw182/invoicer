"use client";

import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { getVatBreakdown } from "@/lib/vat";
import { useTranslations } from "next-intl";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  sortOrder: number;
}

interface Branding {
  logoUrl?: string | null;
  accentColor?: string;
  bankName?: string | null;
  bankIban?: string | null;
  bankBic?: string | null;
}

const INVOICE_TYPE_KEYS: Record<string, string> = {
  standard: "invoice",
  credit_note: "creditNote",
  corrective: "correctiveInvoice",
};

interface InvoicePreviewProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceType?: string;
    status: string;
    issueDate: string | Date;
    supplyDate?: string | Date | null;
    dueDate: string | Date;
    currency: string;
    supplierName: string;
    supplierAddress: string;
    supplierVatId?: string | null;
    supplierCountry?: string;
    clientName: string;
    clientAddress: string;
    clientVatId?: string | null;
    clientCountry: string;
    customerReference?: string | null;
    exchangeRate?: number | null;
    subtotal: number;
    totalVat: number;
    total: number;
    reverseCharge: boolean;
    vatExemptionNote?: string | null;
    correctionOfInvoice?: string | null;
    notes?: string | null;
    paymentTermDays: number;
    lineItems: LineItem[];
    client: { id: string; name: string };
  };
  branding?: Branding;
}

export function InvoicePreview({ invoice, branding }: InvoicePreviewProps) {
  const t = useTranslations("invoices.preview");
  const accentColor = branding?.accentColor || "hsl(var(--primary))";

  const vatBreakdown = getVatBreakdown(
    invoice.lineItems.map((li) => ({
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      taxRate: li.taxRate,
      discount: li.discount ?? 0,
    }))
  );

  const sortedLineItems = [...invoice.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  const hasDiscounts = sortedLineItems.some((li) => (li.discount ?? 0) > 0);
  const hasBankDetails = branding?.bankName || branding?.bankIban;

  return (
    <div className="invoice-paper print-area mx-auto max-w-4xl p-0 overflow-hidden">
      {/* Colored top bar */}
      <div className="h-1.5" style={{ backgroundColor: accentColor }} />

      <div className="p-10">
        {/* Header */}
        <div className="flex justify-between mb-10">
          <div className="flex items-start gap-4">
            {branding?.logoUrl && (
              <img
                src={branding.logoUrl}
                alt="Company logo"
                className="h-14 w-auto max-w-[140px] object-contain"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {invoice.supplierName}
              </h2>
              <p className="whitespace-pre-line text-sm text-muted-foreground mt-2 leading-relaxed">
                {invoice.supplierAddress}
              </p>
              {invoice.supplierVatId && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t("vatId")} {invoice.supplierVatId}
                </p>
              )}
              {invoice.supplierCountry && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t("countryLabel")} {invoice.supplierCountry}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h1
              className="text-3xl font-bold tracking-tight mb-3"
              style={{ color: accentColor }}
            >
              {t(INVOICE_TYPE_KEYS[invoice.invoiceType || "standard"] || "invoice")}
            </h1>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">{t("no")}</span>
                <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">{t("date")}</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              {invoice.supplyDate && (
                <div className="flex justify-end gap-2">
                  <span className="text-muted-foreground">{t("supply")}</span>
                  <span>{formatDate(invoice.supplyDate)}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">{t("due")}</span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-10 rounded-lg bg-muted/50 p-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
            {t("billTo")}
          </p>
          <h3 className="font-semibold text-foreground">{invoice.clientName}</h3>
          <p className="whitespace-pre-line text-sm text-muted-foreground mt-1 leading-relaxed">
            {invoice.clientAddress}
          </p>
          {invoice.clientVatId && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("vatId")} {invoice.clientVatId}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            {t("countryLabel")} {invoice.clientCountry}
          </p>
          {invoice.customerReference && (
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium">{t("yourRef")}</span> {invoice.customerReference}
            </p>
          )}
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b-2"
                style={{ borderColor: `${accentColor}33` }}
              >
                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Qty
                </th>
                <th className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-2">
                  Unit
                </th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Price
                </th>
                {hasDiscounts && (
                  <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Disc.
                  </th>
                )}
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tax
                </th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedLineItems.map((item, idx) => (
                <tr
                  key={item.id}
                  className={idx % 2 === 0 ? "bg-transparent" : "bg-muted/30"}
                >
                  <td className="py-3 pr-4 font-medium">{item.description}</td>
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-center pl-2 text-muted-foreground">
                    {item.unit}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  {hasDiscounts && (
                    <td className="py-3 text-right text-muted-foreground">
                      {(item.discount ?? 0) > 0 ? `${item.discount}%` : "—"}
                    </td>
                  )}
                  <td className="py-3 text-right text-muted-foreground">
                    {item.taxRate}%
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    {formatCurrency(item.netAmount, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="tabular-nums">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              {vatBreakdown.map((vb) => (
                <div key={vb.rate} className="flex justify-between py-1">
                  <span className="text-muted-foreground">VAT {vb.rate}%</span>
                  <span className="tabular-nums">
                    {formatCurrency(vb.vatTotal, invoice.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div
              className="mt-3 flex justify-between border-t-2 pt-3"
              style={{ borderColor: `${accentColor}33` }}
            >
              <span className="text-lg font-bold">{t("total")}</span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Exchange rate */}
        {invoice.exchangeRate && invoice.currency !== "EUR" && (
          <div className="flex justify-end mb-4">
            <p className="text-xs text-muted-foreground">
              {t("exchangeRate", { rate: invoice.exchangeRate, currency: invoice.currency })}
            </p>
          </div>
        )}

        {/* Correction reference */}
        {invoice.correctionOfInvoice && (
          <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50/50 px-4 py-3 text-sm text-purple-800">
            {t("correctionRelates", { type: invoice.invoiceType === "credit_note" ? t("creditNoteType") : t("correctiveInvoiceType"), invoice: invoice.correctionOfInvoice })}
          </div>
        )}

        {/* Notices */}
        {invoice.reverseCharge && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-800">
            {t("reverseChargeNotice")}
          </div>
        )}

        {invoice.vatExemptionNote && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-800">
            {invoice.vatExemptionNote}
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-6 border-t">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
              Notes
            </p>
            <p className="text-sm whitespace-pre-line text-muted-foreground leading-relaxed">
              {invoice.notes}
            </p>
          </div>
        )}

        {/* Bank Details Footer */}
        {hasBankDetails && (
          <div className="mt-8 pt-6 border-t">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
              {t("paymentDetails")}
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
              {branding?.bankName && (
                <div>
                  <span className="text-xs uppercase tracking-wider">{t("bank")}</span>
                  <p className="font-medium text-foreground">{branding.bankName}</p>
                </div>
              )}
              {branding?.bankIban && (
                <div>
                  <span className="text-xs uppercase tracking-wider">{t("iban")}</span>
                  <p className="font-medium text-foreground font-mono text-xs">
                    {branding.bankIban}
                  </p>
                </div>
              )}
              {branding?.bankBic && (
                <div>
                  <span className="text-xs uppercase tracking-wider">{t("bic")}</span>
                  <p className="font-medium text-foreground font-mono text-xs">
                    {branding.bankBic}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
