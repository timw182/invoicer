import type { Invoice, InvoiceLineItem, Client } from "@prisma/client";

export interface DashboardStats {
  totalRevenue: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  totalInvoices: number;
  recentInvoices: InvoiceWithItems[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

export type InvoiceWithItems = Invoice & {
  lineItems: InvoiceLineItem[];
  client: Client;
};

export interface LineItemInput {
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  unit: string;
}
