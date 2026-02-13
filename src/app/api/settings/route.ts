import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Default settings values
const DEFAULTS: Record<string, string> = {
  defaultInterestRate: "12",
  maxLoanAmount: "100000",
  minLoanAmount: "1000",
  maxTermMonths: "36",
  minTermMonths: "1",
};

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = { ...DEFAULTS };

  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return NextResponse.json(settingsMap);
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const allowedKeys = Object.keys(DEFAULTS);

  const updates: { key: string; value: string }[] = [];

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      const value = String(body[key]);

      // Validate numeric values
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return NextResponse.json(
          { error: `Invalid value for ${key}` },
          { status: 400 }
        );
      }

      updates.push({ key, value });
    }
  }

  // Use a transaction to upsert all settings atomically
  await prisma.$transaction(
    updates.map(({ key, value }) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  );

  // Return updated settings
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = { ...DEFAULTS };
  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return NextResponse.json(settingsMap);
}
