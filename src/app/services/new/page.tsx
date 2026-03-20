import { PageHeader } from "@/components/layout/page-header";
import { ServiceForm } from "@/components/services/service-form";

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Service" />
      <ServiceForm />
    </div>
  );
}
