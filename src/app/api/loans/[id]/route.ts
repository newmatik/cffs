import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  const loan = await prisma.loan.findUnique({ where: { id } });
  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  if (action === "approve") {
    if (loan.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending loans can be approved" },
        { status: 400 }
      );
    }

    // Update loan status
    const now = new Date();
    await prisma.loan.update({
      where: { id },
      data: {
        status: "ACTIVE",
        approvedById: session.user.id,
        approvedAt: now,
        startDate: now,
      },
    });

    // Create loan release transaction
    await prisma.transaction.create({
      data: {
        userId: loan.userId,
        type: "LOAN_RELEASE",
        amount: loan.amount,
        description: `Loan disbursement - ${loan.purpose}`,
        loanId: loan.id,
        recordedById: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    if (loan.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending loans can be rejected" },
        { status: 400 }
      );
    }

    await prisma.loan.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
