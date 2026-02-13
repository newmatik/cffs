import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, type, amount, description, loanId } = body;

  if (!userId || !type || !amount || amount <= 0) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (!["DEPOSIT", "WITHDRAWAL", "LOAN_RELEASE", "LOAN_PAYMENT"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid transaction type" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId,
      type,
      amount: parseFloat(amount),
      description: description || "",
      loanId: loanId || null,
      recordedById: session.user.id,
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
