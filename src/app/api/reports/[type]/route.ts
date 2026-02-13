import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Christ Followers Finance System";
  workbook.created = new Date();

  switch (type) {
    case "transactions":
      await generateTransactionsReport(workbook);
      break;
    case "balances":
      await generateBalancesReport(workbook);
      break;
    case "loans":
      await generateLoansReport(workbook);
      break;
    case "collections":
      await generateCollectionsReport(workbook);
      break;
    default:
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=christ-followers-${type}.xlsx`,
    },
  });
}

async function generateTransactionsReport(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet("Transactions");

  sheet.columns = [
    { header: "Date", key: "date", width: 15 },
    { header: "Member", key: "member", width: 25 },
    { header: "Type", key: "type", width: 15 },
    { header: "Amount (PHP)", key: "amount", width: 15 },
    { header: "Description", key: "description", width: 35 },
    { header: "Recorded By", key: "recordedBy", width: 25 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4472C4" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  const transactions = await prisma.transaction.findMany({
    include: { user: true, recordedBy: true },
    orderBy: { createdAt: "desc" },
  });

  for (const txn of transactions) {
    sheet.addRow({
      date: new Date(txn.createdAt).toLocaleDateString("en-PH"),
      member: txn.user.name,
      type: txn.type,
      amount: txn.amount,
      description: txn.description,
      recordedBy: txn.recordedBy.name,
    });
  }

  // Format amount column
  sheet.getColumn("amount").numFmt = "#,##0.00";
}

async function generateBalancesReport(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet("Member Balances");

  sheet.columns = [
    { header: "Member", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Total Deposits (PHP)", key: "deposits", width: 20 },
    { header: "Total Withdrawals (PHP)", key: "withdrawals", width: 22 },
    { header: "Savings Balance (PHP)", key: "balance", width: 22 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF70AD47" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    include: { transactions: true },
    orderBy: { name: "asc" },
  });

  for (const member of members) {
    const deposits = member.transactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((s, t) => s + t.amount, 0);
    const withdrawals = member.transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((s, t) => s + t.amount, 0);

    sheet.addRow({
      name: member.name,
      email: member.email,
      phone: member.phone,
      deposits,
      withdrawals,
      balance: deposits - withdrawals,
    });
  }

  sheet.getColumn("deposits").numFmt = "#,##0.00";
  sheet.getColumn("withdrawals").numFmt = "#,##0.00";
  sheet.getColumn("balance").numFmt = "#,##0.00";
}

async function generateLoansReport(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet("Loans");

  sheet.columns = [
    { header: "Borrower", key: "borrower", width: 25 },
    { header: "Principal (PHP)", key: "principal", width: 18 },
    { header: "Interest Rate", key: "rate", width: 14 },
    { header: "Term (months)", key: "term", width: 14 },
    { header: "Total Due (PHP)", key: "totalDue", width: 18 },
    { header: "Total Paid (PHP)", key: "totalPaid", width: 18 },
    { header: "Outstanding (PHP)", key: "outstanding", width: 18 },
    { header: "Status", key: "status", width: 12 },
    { header: "Purpose", key: "purpose", width: 30 },
    { header: "Applied Date", key: "appliedAt", width: 15 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFED7D31" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  const loans = await prisma.loan.findMany({
    include: { user: true, transactions: true },
    orderBy: { appliedAt: "desc" },
  });

  for (const loan of loans) {
    const totalPaid = loan.transactions
      .filter((t) => t.type === "LOAN_PAYMENT")
      .reduce((s, t) => s + t.amount, 0);

    sheet.addRow({
      borrower: loan.user.name,
      principal: loan.amount,
      rate: `${loan.interestRate}%`,
      term: loan.termMonths,
      totalDue: loan.totalDue,
      totalPaid,
      outstanding: Math.max(0, loan.totalDue - totalPaid),
      status: loan.status,
      purpose: loan.purpose,
      appliedAt: new Date(loan.appliedAt).toLocaleDateString("en-PH"),
    });
  }

  for (const col of ["principal", "totalDue", "totalPaid", "outstanding"]) {
    sheet.getColumn(col).numFmt = "#,##0.00";
  }
}

async function generateCollectionsReport(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet("Monthly Collections");

  sheet.columns = [
    { header: "Month", key: "month", width: 15 },
    { header: "Deposits (PHP)", key: "deposits", width: 18 },
    { header: "Loan Payments (PHP)", key: "loanPayments", width: 20 },
    { header: "Total Collections (PHP)", key: "total", width: 22 },
    { header: "Withdrawals (PHP)", key: "withdrawals", width: 18 },
    { header: "Loan Releases (PHP)", key: "loanReleases", width: 20 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF7030A0" },
  };
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Group by month
  const months = new Map<
    string,
    {
      deposits: number;
      loanPayments: number;
      withdrawals: number;
      loanReleases: number;
    }
  >();

  for (const txn of transactions) {
    const date = new Date(txn.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!months.has(key)) {
      months.set(key, {
        deposits: 0,
        loanPayments: 0,
        withdrawals: 0,
        loanReleases: 0,
      });
    }

    const m = months.get(key)!;
    switch (txn.type) {
      case "DEPOSIT":
        m.deposits += txn.amount;
        break;
      case "LOAN_PAYMENT":
        m.loanPayments += txn.amount;
        break;
      case "WITHDRAWAL":
        m.withdrawals += txn.amount;
        break;
      case "LOAN_RELEASE":
        m.loanReleases += txn.amount;
        break;
    }
  }

  for (const [month, data] of Array.from(months.entries()).sort()) {
    sheet.addRow({
      month,
      deposits: data.deposits,
      loanPayments: data.loanPayments,
      total: data.deposits + data.loanPayments,
      withdrawals: data.withdrawals,
      loanReleases: data.loanReleases,
    });
  }

  for (const col of [
    "deposits",
    "loanPayments",
    "total",
    "withdrawals",
    "loanReleases",
  ]) {
    sheet.getColumn(col).numFmt = "#,##0.00";
  }
}
