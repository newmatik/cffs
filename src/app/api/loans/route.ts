import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const SETTING_DEFAULTS: Record<string, string> = {
  defaultInterestRate: "12",
  maxLoanAmount: "100000",
  minLoanAmount: "1000",
  maxTermMonths: "36",
  minTermMonths: "1",
};

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, amount, interestRate, termMonths, purpose } = body;

  if (!userId || !amount || !interestRate || !termMonths) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const principal = parseFloat(amount);
  const rate = parseFloat(interestRate);
  const term = parseInt(termMonths);

  // Load settings for validation
  const settingsRows = await prisma.setting.findMany();
  const settings: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const s of settingsRows) {
    settings[s.key] = s.value;
  }

  const minLoanAmount = parseFloat(settings.minLoanAmount);
  const maxLoanAmount = parseFloat(settings.maxLoanAmount);
  const minTermMonths = parseInt(settings.minTermMonths);
  const maxTermMonths = parseInt(settings.maxTermMonths);

  if (principal < minLoanAmount || principal > maxLoanAmount) {
    return NextResponse.json(
      { error: `Loan amount must be between ₱${minLoanAmount.toLocaleString()} and ₱${maxLoanAmount.toLocaleString()}` },
      { status: 400 }
    );
  }

  if (term < minTermMonths || term > maxTermMonths) {
    return NextResponse.json(
      { error: `Loan term must be between ${minTermMonths} and ${maxTermMonths} months` },
      { status: 400 }
    );
  }

  // Simple interest calculation
  const totalInterest = principal * (rate / 100) * (term / 12);
  const totalDue = principal + totalInterest;
  const monthlyPayment = parseFloat((totalDue / term).toFixed(2));

  const loan = await prisma.loan.create({
    data: {
      userId,
      amount: principal,
      interestRate: rate,
      termMonths: term,
      monthlyPayment,
      totalDue: parseFloat(totalDue.toFixed(2)),
      purpose: purpose || "",
      status: "PENDING",
    },
  });

  return NextResponse.json(loan, { status: 201 });
}
