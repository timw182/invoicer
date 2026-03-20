import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.businessProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Your Company Name",
      address: "Your Address\n12345 City\nCountry",
      defaultCurrency: "EUR",
      invoicePrefix: "INV",
      defaultPaymentTermDays: 30,
    },
  });
  console.log("Seed completed");
}

main().catch(console.error).finally(() => prisma.$disconnect());
