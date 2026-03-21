import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  billingAddress: z.string().optional(),
  country: z.string().length(2).default("DE"),
  taxId: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unitPrice: z.number().positive("Unit price must be positive"),
  unit: z.enum(["hour", "piece", "project", "day", "flat", "kg"]),
  taxRate: z.number().min(0).max(100).default(19),
});

export const lineItemSchema = z.object({
  serviceId: z.string().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price must be zero or positive"),
  discount: z.number().min(0).max(100).default(0),
  taxRate: z.number().min(0).max(100),
  unit: z.string().default("hour"),
  sortOrder: z.number().optional(),
});

export const invoiceCreateSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.union([z.string(), z.date()]),
  supplyDate: z.union([z.string(), z.date()]).nullable().optional(),
  paymentTermDays: z.number().int().positive().default(30),
  currency: z.string().default("EUR"),
  notes: z.string().nullable().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const invoiceStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
});

export const businessProfileSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  address: z.string().min(1, "Address is required"),
  vatId: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  bankName: z.string().optional(),
  bankIban: z.string().optional(),
  bankBic: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  accentColor: z.string().default("#1e40af"),
  defaultCurrency: z.string().default("EUR"),
  invoicePrefix: z.string().default("INV"),
  defaultPaymentTermDays: z.number().int().positive().default(30),
  smallBusinessExemption: z.boolean(),
  exemptionNote: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceStatusInput = z.infer<typeof invoiceStatusSchema>;
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
