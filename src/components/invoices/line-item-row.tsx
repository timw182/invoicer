"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { calculateLineItem } from "@/lib/vat";
import { formatCurrency } from "@/lib/currency";

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
  const { netAmount, vatAmount, grossAmount } = calculateLineItem(
    value.quantity,
    value.unitPrice,
    value.taxRate
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
        quantity: value.quantity,
      });
    }
  }

  function handleChange(field: keyof LineItemData, rawValue: string | number) {
    onChange(index, { ...value, [field]: rawValue });
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-start border-b pb-3 mb-3">
      <div className="col-span-2">
        <Select
          value={value.serviceId || ""}
          onChange={(e) => handleServiceChange(e.target.value)}
        >
          <option value="">Select service...</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="col-span-3">
        <Input
          value={value.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Description"
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          value={value.quantity}
          onChange={(e) => handleChange("quantity", parseFloat(e.target.value) || 0)}
          placeholder="Qty"
          min={0}
          step="0.01"
        />
      </div>
      <div className="col-span-1">
        <Select
          value={value.unit}
          onChange={(e) => handleChange("unit", e.target.value)}
        >
          <option value="hour">hour</option>
          <option value="day">day</option>
          <option value="piece">piece</option>
          <option value="project">project</option>
          <option value="month">month</option>
        </Select>
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          value={value.unitPrice}
          onChange={(e) => handleChange("unitPrice", parseFloat(e.target.value) || 0)}
          placeholder="Price"
          min={0}
          step="0.01"
        />
      </div>
      <div className="col-span-1">
        <Input
          type="number"
          value={value.taxRate}
          onChange={(e) => handleChange("taxRate", parseFloat(e.target.value) || 0)}
          placeholder="Tax %"
          min={0}
          step="0.01"
        />
      </div>
      <div className="col-span-2 flex items-center gap-2 pt-2 text-sm">
        <span className="whitespace-nowrap" title="Net">
          {formatCurrency(netAmount, currency)}
        </span>
        <span className="text-muted-foreground whitespace-nowrap" title="VAT">
          +{formatCurrency(vatAmount, currency)}
        </span>
        <span className="font-medium whitespace-nowrap" title="Gross">
          ={formatCurrency(grossAmount, currency)}
        </span>
      </div>
      <div className="col-span-1 flex justify-end pt-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(index)}
          aria-label="Remove line item"
        >
          X
        </Button>
      </div>
    </div>
  );
}
