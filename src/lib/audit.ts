import { prisma } from "@/lib/db";

interface AuditEntry {
  userId?: string;
  userName?: string;
  action: "create" | "update" | "delete" | "export" | "login" | "logout" | "backup";
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
}

export async function audit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
