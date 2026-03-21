import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
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

  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@invoicer.local" },
    update: {},
    create: {
      email: "admin@invoicer.local",
      name: "Admin",
      password: adminPassword,
      role: "admin",
    },
  });

  console.log("Seed completed");
  console.log("Default admin: admin@invoicer.local / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
