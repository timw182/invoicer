import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { businessProfileSchema } from "@/lib/validators";

const defaultProfile = {
  name: "",
  address: "",
  vatId: "",
  email: "",
  phone: "",
  bankName: "",
  bankIban: "",
  bankBic: "",
  defaultCurrency: "EUR",
  invoicePrefix: "INV",
  defaultPaymentTermDays: 30,
  smallBusinessExemption: false,
  exemptionNote: "",
};

export async function GET() {
  try {
    let profile = await prisma.businessProfile.findFirst();

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: defaultProfile,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const parsed = businessProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    let profile = await prisma.businessProfile.findFirst();

    if (!profile) {
      profile = await prisma.businessProfile.create({
        data: parsed.data,
      });
    } else {
      profile = await prisma.businessProfile.update({
        where: { id: profile.id },
        data: parsed.data,
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
