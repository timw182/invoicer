"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LineItemRow, type LineItemData } from "@/components/invoices/line-item-row";
import { calculateLineItem, getVatBreakdown, shouldReverseCharge } from "@/lib/vat";
import { formatCurrency } from "@/lib/currency";

interface ClientOption {
  id: string;
  name: string;
  country: string;
  taxId?: string | null;
}

interface ServiceOption {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  unit: string;
  taxRate: number;
}

interface BusinessProfile {
  id: string;
  name: string;
  address: string;
  vatId?: string | null;
  defaultCurrency: string;
  defaultPaymentTermDays: number;
  smallBusinessExemption: boolean;
  exemptionNote?: string | null;
}

interface InitialData {
  id: string;
  clientId: string;
  issueDate: string | Date;
  supplyDate?: string | Date | null;
  paymentTermDays: number;
  currency: string;
  notes?: string | null;
  lineItems: Array<{
    serviceId?: string | null;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount?: number;
    taxRate: number;
  }>;
}

interface InvoiceFormProps {
  clients: ClientOption[];
  services: ServiceOption[];
  businessProfile: BusinessProfile;
  initialData?: InitialData;
}

function toDateString(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  return date.toISOString().split("T")[0];
}

const emptyLineItem: LineItemData = {
  description: "",
  quantity: 1,
  unit: "hour",
  unitPrice: 0,
  discount: 0,
  taxRate: 19,
};

export function InvoiceForm({
  clients,
  services,
  businessProfile,
  initialData,
}: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [clientId, setClientId] = useState(initialData?.clientId || "");
  const [issueDate, setIssueDate] = useState(
    toDateString(initialData?.issueDate) || new Date().toISOString().split("T")[0]
  );
  const [supplyDate, setSupplyDate] = useState(
    toDateString(initialData?.supplyDate)
  );
  const [paymentTermDays, setPaymentTermDays] = useState(
    initialData?.paymentTermDays ?? businessProfile.defaultPaymentTermDays
  );
  const [currency, setCurrency] = useState(
    initialData?.currency || businessProfile.defaultCurrency
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [lineItems, setLineItems] = useState<LineItemData[]>(
    initialData?.lineItems.map((li) => ({
      serviceId: li.serviceId || undefined,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unitPrice: li.unitPrice,
      discount: li.discount ?? 0,
      taxRate: businessProfile.smallBusinessExemption ? 0 : li.taxRate,
    })) || [
      {
        ...emptyLineItem,
        taxRate: businessProfile.smallBusinessExemption ? 0 : 19,
      },
    ]
  );

  const selectedClient = clients.find((c) => c.id === clientId);

  const isReverseCharge = useMemo(() => {
    if (!selectedClient || !businessProfile.vatId) return false;
    // Extract country from business address (assume first 2 chars of vatId or default "DE")
    const businessCountry = businessProfile.vatId?.substring(0, 2) || "DE";
    return shouldReverseCharge(
      businessCountry,
      selectedClient.country,
      selectedClient.taxId
    );
  }, [selectedClient, businessProfile.vatId]);

  const effectiveLineItems = useMemo(() => {
    if (businessProfile.smallBusinessExemption || isReverseCharge) {
      return lineItems.map((li) => ({ ...li, taxRate: 0 }));
    }
    return lineItems;
  }, [lineItems, businessProfile.smallBusinessExemption, isReverseCharge]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalVat = 0;
    for (const item of effectiveLineItems) {
      const { netAmount, vatAmount } = calculateLineItem(
        item.quantity,
        item.unitPrice,
        item.taxRate,
        item.discount
      );
      subtotal += netAmount;
      totalVat += vatAmount;
    }
    subtotal = Math.round(subtotal * 100) / 100;
    totalVat = Math.round(totalVat * 100) / 100;
    const total = Math.round((subtotal + totalVat) * 100) / 100;
    return { subtotal, totalVat, total };
  }, [effectiveLineItems]);

  const vatBreakdown = useMemo(
    () => getVatBreakdown(effectiveLineItems),
    [effectiveLineItems]
  );

  function handleLineItemChange(index: number, data: LineItemData) {
    setLineItems((prev) => {
      const updated = [...prev];
      updated[index] = data;
      return updated;
    });
  }

  function handleLineItemRemove(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        ...emptyLineItem,
        taxRate: businessProfile.smallBusinessExemption || isReverseCharge ? 0 : 19,
      },
    ]);
  }

  async function handleSubmit(sendAfterSave: boolean) {
    if (!clientId) {
      alert("Please select a client.");
      return;
    }
    if (effectiveLineItems.length === 0) {
      alert("Please add at least one line item.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        clientId,
        issueDate,
        supplyDate: supplyDate || null,
        paymentTermDays,
        currency,
        notes: notes || null,
        lineItems: effectiveLineItems.map((li, i) => ({
          serviceId: li.serviceId || null,
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          unitPrice: li.unitPrice,
          discount: li.discount,
          taxRate: li.taxRate,
          sortOrder: i,
        })),
      };

      const method = initialData ? "PUT" : "POST";
      const url = initialData
        ? `/api/invoices/${initialData.id}`
        : "/api/invoices";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save invoice");
      }

      const invoice = await response.json();

      if (sendAfterSave && !initialData) {
        await fetch(`/api/invoices/${invoice.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "sent" }),
        });
      }

      router.push("/invoices");
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select
                id="client"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplyDate">Supply Date (optional)</Label>
              <Input
                id="supplyDate"
                type="date"
                value={supplyDate}
                onChange={(e) => setSupplyDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTermDays">Payment Terms (days)</Label>
              <Input
                id="paymentTermDays"
                type="number"
                value={paymentTermDays}
                onChange={(e) =>
                  setPaymentTermDays(parseInt(e.target.value) || 0)
                }
                min={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isReverseCharge && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Reverse charge applies: VAT will not be charged. The recipient is
          liable for VAT.
        </div>
      )}

      {businessProfile.smallBusinessExemption && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Small business exemption active: No VAT will be charged.
          {businessProfile.exemptionNote && (
            <span className="block mt-1">{businessProfile.exemptionNote}</span>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid grid-cols-[2fr_3fr_1fr_1fr_1fr_1fr_1fr_2fr_auto] gap-2 text-xs font-medium text-muted-foreground">
            <div>Service</div>
            <div>Description</div>
            <div>Qty</div>
            <div>Unit</div>
            <div>Price</div>
            <div>Disc %</div>
            <div>Tax %</div>
            <div>Amounts</div>
            <div className="w-8" />
          </div>
          {effectiveLineItems.map((item, index) => (
            <LineItemRow
              key={index}
              index={index}
              services={services}
              value={item}
              currency={currency}
              onChange={handleLineItemChange}
              onRemove={handleLineItemRemove}
            />
          ))}
          <Button type="button" variant="outline" onClick={addLineItem}>
            + Add Line Item
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal (Net)</span>
            <span>{formatCurrency(totals.subtotal, currency)}</span>
          </div>
          {vatBreakdown.map((vb) => (
            <div key={vb.rate} className="flex justify-between text-sm">
              <span>VAT {vb.rate}%</span>
              <span>{formatCurrency(vb.vatTotal, currency)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>{formatCurrency(totals.total, currency)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes for the invoice..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/invoices")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={() => handleSubmit(false)}
        >
          {loading ? "Saving..." : "Save Invoice"}
        </Button>
      </div>
    </div>
  );
}
