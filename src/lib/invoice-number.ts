import { PrismaClient } from "@prisma/client";

type PrismaTransactionClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

export async function generateInvoiceNumber(
  tx: PrismaTransactionClient | PrismaClient
): Promise<string> {
  const profile = await tx.businessProfile.findFirstOrThrow();

  await tx.businessProfile.update({
    where: { id: profile.id },
    data: { nextNumber: profile.nextNumber + 1 },
  });

  const year = new Date().getFullYear();
  const paddedNumber = String(profile.nextNumber).padStart(4, "0");

  return `${profile.invoicePrefix}-${year}-${paddedNumber}`;
}
