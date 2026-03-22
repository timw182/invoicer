"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";

interface Service {
  id: string;
  name: string;
  unitPrice: number;
  taxRate: number;
  unit: string;
  active: boolean;
}

interface ServiceTableProps {
  services: Service[];
}

export function ServiceTable({ services }: ServiceTableProps) {
  const router = useRouter();
  const t = useTranslations("services");
  const tc = useTranslations("common");

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t("deleteConfirm", { name }))) {
      return;
    }

    try {
      const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete service");
      }
      router.refresh();
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{tc("name")}</TableHead>
          <TableHead>{t("unitPrice")}</TableHead>
          <TableHead>{t("taxRate")}</TableHead>
          <TableHead>{t("unit")}</TableHead>
          <TableHead>{tc("active")}</TableHead>
          <TableHead className="text-right">{tc("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              {t("noServices")}
            </TableCell>
          </TableRow>
        ) : (
          services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.name}</TableCell>
              <TableCell>{formatCurrency(service.unitPrice)}</TableCell>
              <TableCell>{service.taxRate}%</TableCell>
              <TableCell className="capitalize">{service.unit}</TableCell>
              <TableCell>
                <Badge variant={service.active ? "default" : "secondary"}>
                  {service.active ? tc("active") : tc("inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/services/${service.id}/edit`}>{tc("edit")}</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id, service.name)}
                  >
                    {tc("delete")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
