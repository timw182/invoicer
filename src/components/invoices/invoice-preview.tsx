import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { getVatBreakdown } from "@/lib/vat";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  sortOrder: number;
}

interface InvoicePreviewProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    issueDate: string | Date;
    supplyDate?: string | Date | null;
    dueDate: string | Date;
    currency: string;
    supplierName: string;
    supplierAddress: string;
    supplierVatId?: string | null;
    clientName: string;
    clientAddress: string;
    clientVatId?: string | null;
    clientCountry: string;
    subtotal: number;
    totalVat: number;
    total: number;
    reverseCharge: boolean;
    vatExemptionNote?: string | null;
    notes?: string | null;
    paymentTermDays: number;
    lineItems: LineItem[];
    client: { id: string; name: string };
  };
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const vatBreakdown = getVatBreakdown(
    invoice.lineItems.map((li) => ({
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      taxRate: li.taxRate,
    }))
  );

  const sortedLineItems = [...invoice.lineItems].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  return (
    <div className="invoice-paper mx-auto max-w-4xl p-0 overflow-hidden">
      {/* Colored top bar */}
      <div className="h-1.5 bg-primary" />

      <div className="p-10">
        {/* Header */}
        <div className="flex justify-between mb-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {invoice.supplierName}
            </h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground mt-2 leading-relaxed">
              {invoice.supplierAddress}
            </p>
            {invoice.supplierVatId && (
              <p className="text-sm text-muted-foreground mt-1">
                VAT ID: {invoice.supplierVatId}
              </p>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold tracking-tight text-primary mb-3">
              INVOICE
            </h1>
            <div className="text-sm space-y-1.5">
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">No.</span>
                <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              {invoice.supplyDate && (
                <div className="flex justify-end gap-2">
                  <span className="text-muted-foreground">Supply</span>
                  <span>{formatDate(invoice.supplyDate)}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <span className="text-muted-foreground">Due</span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-10 rounded-lg bg-muted/50 p-5">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-2">
            Bill To
          </p>
          <h3 className="font-semibold text-foreground">{invoice.clientName}</h3>
          <p className="whitespace-pre-line text-sm text-muted-foreground mt-1 leading-relaxed">
            {invoice.clientAddress}
          </p>
          {invoice.clientVatId && (
            <p className="text-sm text-muted-foreground mt-1">
              VAT ID: {invoice.clientVatId}
            </p>
          )}
        </div>

        {/* Line Items Table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary/20">
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
                <span className="text-muted-foreground">Subtotal</span>
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
            <div className="mt-3 flex justify-between border-t-2 border-primary/20 pt-3">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(invoice.total, invoice.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Notices */}
        {invoice.reverseCharge && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm text-blue-800">
            Reverse charge: VAT to be accounted for by the recipient (Art. 196 EU VAT Directive).
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
      </div>
    </div>
  );
}
