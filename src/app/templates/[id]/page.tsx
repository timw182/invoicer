"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface ServiceOption {
  id: string;
  name: string;
  unitPrice: number;
  unit: string;
  taxRate: number;
  description: string | null;
}

interface TemplateLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxRate: number;
  serviceId: string | null;
}

const emptyLine: TemplateLineItem = {
  description: "",
  quantity: 1,
  unit: "hour",
  unitPrice: 0,
  discount: 0,
  taxRate: 17,
  serviceId: null,
};

export default function EditTemplatePage() {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lineItems, setLineItems] = useState<TemplateLineItem[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/templates/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/services").then((r) => (r.ok ? r.json() : [])),
    ]).then(([tpl, svcs]) => {
      if (tpl) {
        setName(tpl.name);
        setDescription(tpl.description || "");
        setLineItems(
          tpl.lineItems.map((li: TemplateLineItem & { id: string }) => ({
            description: li.description,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
            discount: li.discount || 0,
            taxRate: li.taxRate,
            serviceId: li.serviceId,
          }))
        );
      }
      setServices(svcs.filter((s: ServiceOption & { active: boolean }) => s.active));
      setLoading(false);
    });
  }, [id]);

  function updateLine(index: number, field: keyof TemplateLineItem, value: unknown) {
    setLineItems((prev) => prev.map((li, i) => (i === index ? { ...li, [field]: value } : li)));
  }

  function selectService(index: number, serviceId: string) {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    setLineItems((prev) =>
      prev.map((li, i) =>
        i === index
          ? { ...li, serviceId: svc.id, description: svc.description || svc.name, unitPrice: svc.unitPrice, unit: svc.unit, taxRate: svc.taxRate }
          : li
      )
    );
  }

  function removeLine(index: number) {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || lineItems.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, lineItems }),
      });
      if (res.ok) router.push("/templates");
      else alert("Failed to update template");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("editTemplate")} description={tc("loading")} />
        <div className="text-muted-foreground">{tc("loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("editTemplate")} description={t("editingTemplate", { name })} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>{t("templateDetails")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("templateName")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("descriptionOptional")}</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("lineItems")}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => setLineItems((prev) => [...prev, { ...emptyLine }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> {t("addLine")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lineItems.map((li, idx) => (
                <div key={idx} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">{t("line", { index: idx + 1 })}</span>
                    {lineItems.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeLine(idx)} className="text-red-600 hover:text-red-700 h-7 px-2">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {services.length > 0 && (
                    <div className="space-y-1">
                      <Label className="text-xs">{t("serviceOptional")}</Label>
                      <Select value={li.serviceId || ""} onChange={(e) => e.target.value ? selectService(idx, e.target.value) : updateLine(idx, "serviceId", null)}>
                        <option value="">— Manual entry —</option>
                        {services.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">{tc("description")}</Label>
                    <Input value={li.description} onChange={(e) => updateLine(idx, "description", e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-5 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" step="0.01" min="0.01" value={li.quantity} onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Select value={li.unit} onChange={(e) => updateLine(idx, "unit", e.target.value)}>
                        <option value="hour">Hour</option>
                        <option value="day">Day</option>
                        <option value="piece">Piece</option>
                        <option value="kg">Kg</option>
                        <option value="project">Project</option>
                        <option value="flat">Flat</option>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unit Price</Label>
                      <Input type="number" step="0.01" min="0" value={li.unitPrice} onChange={(e) => updateLine(idx, "unitPrice", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Discount %</Label>
                      <Input type="number" step="0.01" min="0" max="100" value={li.discount} onChange={(e) => updateLine(idx, "discount", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tax %</Label>
                      <Input type="number" step="0.01" min="0" value={li.taxRate} onChange={(e) => updateLine(idx, "taxRate", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving}>
          {saving ? tc("saving") : t("saveTemplate")}
        </Button>
      </form>
    </div>
  );
}
