"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { calculateLineItem } from "@/lib/vat";
import { formatCurrency } from "@/lib/currency";
import { Trash2 } from "lucide-react";

interface ServiceOption {
  id: string;
  name: string;
  description?: string | null;
  unitPrice: number;
  unit: string;
  taxRate: number;
}

export interface LineItemData {
  serviceId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

interface LineItemRowProps {
  index: number;
  services: ServiceOption[];
  value: LineItemData;
  currency: string;
  onChange: (index: number, data: LineItemData) => void;
  onRemove: (index: number) => void;
}

export function LineItemRow({
  index,
  services,
  value,
  currency,
  onChange,
  onRemove,
}: LineItemRowProps) {
  const { netAmount, grossAmount } = calculateLineItem(
    value.quantity,
    value.unitPrice,
    value.taxRate,
    value.discount
  );

  function handleServiceChange(serviceId: string) {
    if (!serviceId) {
      onChange(index, { ...value, serviceId: undefined });
      return;
    }
    const service = services.find((s) => s.id === serviceId);
    if (service) {
      onChange(index, {
        serviceId: service.id,
        description: service.description || service.name,
        unitPrice: service.unitPrice,
        unit: service.unit,
        taxRate: service.taxRate,
        discount: value.discount,
        quantity: value.quantity,
      });
    }
  }

  function handleChange(field: keyof LineItemData, rawValue: string | number) {
    onChange(index, { ...value, [field]: rawValue });
  }

  return (
    <>
      {/* Desktop: grid layout */}
      <div className="hidden lg:grid group grid-cols-[2fr_3fr_1fr_1fr_1fr_1fr_1fr_2fr_auto] gap-2 items-start rounded-lg border border-transparent hover:border-border hover:bg-muted/30 px-2 py-2.5 -mx-2 transition-colors">
        <div>
          <Select value={value.serviceId || ""} onChange={(e) => handleServiceChange(e.target.value)} className="text-xs">
            <option value="">Service...</option>
            {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </Select>
        </div>
        <div>
          <Input value={value.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Description" className="text-sm" />
        </div>
        <div>
          <Input type="number" value={value.quantity} onChange={(e) => handleChange("quantity", parseFloat(e.target.value) || 0)} min={0} step="0.01" className="text-sm" />
        </div>
        <div>
          <Select value={value.unit} onChange={(e) => handleChange("unit", e.target.value)} className="text-xs">
            <option value="hour">hour</option>
            <option value="day">day</option>
            <option value="piece">piece</option>
            <option value="kg">kg</option>
            <option value="project">project</option>
            <option value="flat">flat</option>
          </Select>
        </div>
        <div>
          <Input type="number" value={value.unitPrice} onChange={(e) => handleChange("unitPrice", parseFloat(e.target.value) || 0)} min={0} step="0.01" className="text-sm" />
        </div>
        <div>
          <Input type="number" value={value.discount} onChange={(e) => handleChange("discount", parseFloat(e.target.value) || 0)} min={0} max={100} step="0.01" className="text-sm" />
        </div>
        <div>
          <Input type="number" value={value.taxRate} onChange={(e) => handleChange("taxRate", parseFloat(e.target.value) || 0)} min={0} step="0.01" className="text-sm" />
        </div>
        <div className="flex flex-col items-end justify-center gap-0.5 pt-1.5 text-xs tabular-nums">
          <span className="text-muted-foreground">Net {formatCurrency(netAmount, currency)}</span>
          <span className="font-semibold text-sm">{formatCurrency(grossAmount, currency)}</span>
        </div>
        <div className="flex justify-end pt-1.5">
          <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)} className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity" aria-label="Remove">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Mobile: stacked card layout */}
      <div className="lg:hidden rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase">Item {index + 1}</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tabular-nums">{formatCurrency(grossAmount, currency)}</span>
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)} className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {services.length > 0 && (
          <div>
            <Label className="text-xs">Service</Label>
            <Select value={value.serviceId || ""} onChange={(e) => handleServiceChange(e.target.value)} className="text-sm">
              <option value="">Select service...</option>
              {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </Select>
          </div>
        )}

        <div>
          <Label className="text-xs">Description</Label>
          <Input value={value.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Description" className="text-sm" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Qty</Label>
            <Input type="number" value={value.quantity} onChange={(e) => handleChange("quantity", parseFloat(e.target.value) || 0)} min={0} step="0.01" className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Unit</Label>
            <Select value={value.unit} onChange={(e) => handleChange("unit", e.target.value)} className="text-sm">
              <option value="hour">Hour</option>
              <option value="day">Day</option>
              <option value="piece">Piece</option>
              <option value="kg">Kg</option>
              <option value="project">Project</option>
              <option value="flat">Flat</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Price</Label>
            <Input type="number" value={value.unitPrice} onChange={(e) => handleChange("unitPrice", parseFloat(e.target.value) || 0)} min={0} step="0.01" className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Disc %</Label>
            <Input type="number" value={value.discount} onChange={(e) => handleChange("discount", parseFloat(e.target.value) || 0)} min={0} max={100} step="0.01" className="text-sm" />
          </div>
          <div>
            <Label className="text-xs">Tax %</Label>
            <Input type="number" value={value.taxRate} onChange={(e) => handleChange("taxRate", parseFloat(e.target.value) || 0)} min={0} step="0.01" className="text-sm" />
          </div>
        </div>

        <div className="text-right text-xs text-muted-foreground tabular-nums">
          Net {formatCurrency(netAmount, currency)}
        </div>
      </div>
    </>
  );
}
