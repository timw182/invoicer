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
import { calculateLineItem } from "@/lib/vat";
import { formatCurrency, SUPPORTED_CURRENCIES } from "@/lib/currency";

interface ClientOption {
  id: string;
  name: string;
}

interface ServiceOption {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  unit: string;
  taxRate: number;
}

interface InitialData {
  id: string;
  name: string;
  clientId: string;
  frequency: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  currency: string;
  paymentTermDays: number;
  notes?: string | null;
  autoSend: boolean;
  lineItems: Array<{
    serviceId?: string | null;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>;
}

interface RecurringFormProps {
  clients: ClientOption[];
  services: ServiceOption[];
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
  taxRate: 17,
};

export function RecurringForm({ clients, services, initialData }: RecurringFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [clientId, setClientId] = useState(initialData?.clientId || "");
  const [frequency, setFrequency] = useState(initialData?.frequency || "monthly");
  const [startDate, setStartDate] = useState(
    toDateString(initialData?.startDate) || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(toDateString(initialData?.endDate));
  const [currency, setCurrency] = useState(initialData?.currency || "EUR");
  const [paymentTermDays, setPaymentTermDays] = useState(initialData?.paymentTermDays ?? 30);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [autoSend, setAutoSend] = useState(initialData?.autoSend ?? false);
  const [lineItems, setLineItems] = useState<LineItemData[]>(
    initialData?.lineItems.map((li) => ({
      serviceId: li.serviceId || undefined,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit,
      unitPrice: li.unitPrice,
      discount: li.discount ?? 0,
      taxRate: li.taxRate,
    })) || [{ ...emptyLineItem }]
  );

  const totals = useMemo(() => {
    let subtotal = 0;
    for (const item of lineItems) {
      const { netAmount } = calculateLineItem(item.quantity, item.unitPrice, item.taxRate, item.discount);
      subtotal += netAmount;
    }
    return { subtotal: Math.round(subtotal * 100) / 100 };
  }, [lineItems]);

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
    setLineItems((prev) => [...prev, { ...emptyLineItem }]);
  }

  async function handleSubmit() {
    if (!name || !clientId) {
      alert("Please fill in the name and select a client.");
      return;
    }
    if (lineItems.length === 0) {
      alert("Please add at least one line item.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        clientId,
        frequency,
        startDate,
        endDate: endDate || null,
        currency,
        paymentTermDays,
        notes: notes || null,
        autoSend,
        lineItems: lineItems.map((li, i) => ({
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
      const url = initialData ? `/api/recurring/${initialData.id}` : "/api/recurring";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }

      router.push("/recurring");
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
          <CardTitle>Recurring Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Monthly retainer - Acme Corp"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTermDays">Payment Terms (days)</Label>
              <Input
                id="paymentTermDays"
                type="number"
                value={paymentTermDays}
                onChange={(e) => setPaymentTermDays(parseInt(e.target.value) || 0)}
                min={0}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSend}
                  onChange={(e) => setAutoSend(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">Auto-send generated invoices</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

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
          {lineItems.map((item, index) => (
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
        <CardContent>
          <div className="flex justify-between text-sm">
            <span>Estimated Net per Invoice</span>
            <span className="font-bold">{formatCurrency(totals.subtotal, currency)}</span>
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
            placeholder="Notes to include on generated invoices..."
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/recurring")}>Cancel</Button>
        <Button disabled={loading} onClick={handleSubmit}>
          {loading ? "Saving..." : initialData ? "Update Template" : "Create Template"}
        </Button>
      </div>
    </div>
  );
}
