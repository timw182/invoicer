"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
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
          <TableHead>Name</TableHead>
          <TableHead>Unit Price</TableHead>
          <TableHead>Tax Rate</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead>Active</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No services found.
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
                  {service.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/services/${service.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id, service.name)}
                  >
                    Delete
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
