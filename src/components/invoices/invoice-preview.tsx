import { formatDate } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency";
import { calculateLineItem, getVatBreakdown } from "@/lib/vat";
import { Separator } from "@/components/ui/separator";

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
    client: {
      id: string;
      name: string;
    };
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
    <div className="mx-auto max-w-4xl rounded-lg border bg-white p-10 shadow-sm">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold">{invoice.supplierName}</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground mt-1">
            {invoice.supplierAddress}
          </p>
          {invoice.supplierVatId && (
            <p className="text-sm text-muted-foreground mt-1">
              VAT ID: {invoice.supplierVatId}
            </p>
          )}
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold mb-2">INVOICE</h1>
          <div className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Number: </span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Issue Date: </span>
              {formatDate(invoice.issueDate)}
            </p>
            {invoice.supplyDate && (
              <p>
                <span className="text-muted-foreground">Supply Date: </span>
                {formatDate(invoice.supplyDate)}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Due Date: </span>
              {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Client */}
      <div className="mb-8">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Bill To
        </p>
        <h3 className="font-semibold">{invoice.clientName}</h3>
        <p className="whitespace-pre-line text-sm text-muted-foreground mt-1">
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
            <tr className="border-b-2 border-gray-200">
              <th className="py-2 text-left font-medium">Description</th>
              <th className="py-2 text-right font-medium">Qty</th>
              <th className="py-2 text-left font-medium pl-3">Unit</th>
              <th className="py-2 text-right font-medium">Unit Price</th>
              <th className="py-2 text-right font-medium">Tax Rate</th>
              <th className="py-2 text-right font-medium">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            {sortedLineItems.map((item) => {
              const { netAmount } = calculateLineItem(
                item.quantity,
                item.unitPrice,
                item.taxRate
              );
              return (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-2">{item.description}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                  <td className="py-2 pl-3">{item.unit}</td>
                  <td className="py-2 text-right">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="py-2 text-right">{item.taxRate}%</td>
                  <td className="py-2 text-right">
                    {formatCurrency(netAmount, invoice.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* VAT Breakdown and Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          {vatBreakdown.map((vb) => (
            <div key={vb.rate} className="flex justify-between text-sm">
              <span>VAT {vb.rate}%</span>
              <span>{formatCurrency(vb.vatTotal, invoice.currency)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      {/* Reverse Charge Notice */}
      {invoice.reverseCharge && (
        <div className="mb-4 rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Reverse charge: VAT to be accounted for by the recipient.
        </div>
      )}

      {/* VAT Exemption Notice */}
      {invoice.vatExemptionNote && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {invoice.vatExemptionNote}
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Notes
          </p>
          <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}
