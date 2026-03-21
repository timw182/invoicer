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
  taxRate: z.number().min(0).max(100).default(17),
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
  invoiceType: z.enum(["standard", "credit_note", "corrective"]).default("standard"),
  issueDate: z.union([z.string(), z.date()]),
  supplyDate: z.union([z.string(), z.date()]).nullable().optional(),
  paymentTermDays: z.number().int().positive().default(30),
  currency: z.string().default("EUR"),
  customerReference: z.string().nullable().optional(),
  exchangeRate: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const invoiceStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
});

export const businessProfileSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().length(2).default("DE"),
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
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).default(587),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().optional(),
  smtpSecure: z.boolean().default(false),
});

export const recurringInvoiceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clientId: z.string().min(1, "Client is required"),
  frequency: z.enum(["monthly", "quarterly", "yearly"]),
  startDate: z.union([z.string(), z.date()]),
  endDate: z.union([z.string(), z.date()]).nullable().optional(),
  currency: z.string().default("EUR"),
  paymentTermDays: z.number().int().positive().default(30),
  notes: z.string().nullable().optional(),
  autoSend: z.boolean().default(false),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense"]),
  color: z.string().nullable().optional(),
});

export const bankAccountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bankName: z.string().optional(),
  iban: z.string().optional(),
  currency: z.string().default("EUR"),
  isDefault: z.boolean().default(false),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  taxAmount: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(100).default(0),
  date: z.union([z.string(), z.date()]),
  categoryId: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  invoiceId: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type LineItemInput = z.infer<typeof lineItemSchema>;
export type InvoiceCreateInput = z.infer<typeof invoiceCreateSchema>;
export type InvoiceStatusInput = z.infer<typeof invoiceStatusSchema>;
export type BusinessProfileInput = z.infer<typeof businessProfileSchema>;
export type RecurringInvoiceInput = z.infer<typeof recurringInvoiceSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
