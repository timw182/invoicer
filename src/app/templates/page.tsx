"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Trash2, Pencil } from "lucide-react";

interface TemplateItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  taxRate: number;
}

interface Template {
  id: string;
  name: string;
  description: string | null;
  lineItems: TemplateItem[];
}

export default function TemplatesPage() {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("title")} description={t("descriptionShort")} />
        <div className="text-muted-foreground">{tc("loading")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Link href="/templates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t("newTemplate")}
            </Button>
          </Link>
        }
      />

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>{t("noTemplates")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{tpl.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {tpl.lineItems.length !== 1
                          ? t("lineCountPlural", { count: tpl.lineItems.length })
                          : t("lineCount", { count: tpl.lineItems.length })}
                      </Badge>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-muted-foreground mb-2">{tpl.description}</p>
                    )}
                    <div className="space-y-0.5">
                      {tpl.lineItems.map((li) => (
                        <div key={li.id} className="text-xs text-muted-foreground flex gap-4">
                          <span className="truncate flex-1">{li.description}</span>
                          <span className="tabular-nums whitespace-nowrap">
                            {li.quantity} {li.unit} x {li.unitPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/templates/${tpl.id}`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tpl.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
