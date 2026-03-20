import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy");
}

export function isOverdue(dueDate: Date | string, status: string): boolean {
  if (status === "paid" || status === "cancelled") return false;
  return new Date(dueDate) < new Date();
}
