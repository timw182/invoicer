import { PageHeader } from "@/components/layout/page-header";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Client" />
      <ClientForm />
    </div>
  );
}
