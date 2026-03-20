"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { serviceSchema, type ServiceInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const UNIT_OPTIONS = [
  { value: "hour", label: "Hour" },
  { value: "piece", label: "Piece" },
  { value: "project", label: "Project" },
  { value: "day", label: "Day" },
  { value: "flat", label: "Flat Rate" },
];

interface ServiceFormProps {
  initialData?: ServiceInput & { id: string };
  onSuccess?: () => void;
}

export function ServiceForm({ initialData, onSuccess }: ServiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceInput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: initialData ?? {
      name: "",
      description: "",
      unitPrice: 0,
      unit: "hour",
      taxRate: 19,
    },
  });

  const onSubmit = async (data: ServiceInput) => {
    setIsSubmitting(true);
    try {
      const url = initialData
        ? `/api/services/${initialData.id}`
        : "/api/services";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save service");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/services");
      }
    } catch (error) {
      console.error("Error saving service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unitPrice">Unit Price</Label>
        <Input
          id="unitPrice"
          type="number"
          step="0.01"
          {...register("unitPrice", { valueAsNumber: true })}
        />
        {errors.unitPrice && (
          <p className="text-sm text-destructive">
            {errors.unitPrice.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">Unit</Label>
        <Select id="unit" {...register("unit")}>
          {UNIT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        {errors.unit && (
          <p className="text-sm text-destructive">{errors.unit.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxRate">Tax Rate (%)</Label>
        <Input
          id="taxRate"
          type="number"
          step="0.01"
          {...register("taxRate", { valueAsNumber: true })}
        />
        {errors.taxRate && (
          <p className="text-sm text-destructive">{errors.taxRate.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Service"
              : "Create Service"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/services")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
