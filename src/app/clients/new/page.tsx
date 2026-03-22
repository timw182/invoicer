"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  const t = useTranslations("clients");

  return (
    <div className="space-y-6">
      <PageHeader title={t("newClient")} />
      <ClientForm />
    </div>
  );
}
