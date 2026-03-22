import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/components/services/service-form";
import { useTranslations } from "next-intl";

export default function NewServicePage() {
  const t = useTranslations("services");

  return (
    <div className="space-y-6">
      <PageHeader title={t("newService")} />
      <ServiceForm />
    </div>
  );
}
