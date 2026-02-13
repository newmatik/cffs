import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      transactions: {
        include: { loan: true, recordedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Calculate summary values
  const deposits = member.transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const withdrawals = member.transactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsBalance = deposits - withdrawals;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Christ Followers Finance System";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Statement");

  // --- Member Info Header ---
  sheet.mergeCells("A1:E1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "Christ Followers - Member Statement";
  titleCell.font = { bold: true, size: 16, color: { argb: "FF1F2937" } };
  titleCell.alignment = { horizontal: "center" };

  sheet.mergeCells("A2:E2");
  const nameCell = sheet.getCell("A2");
  nameCell.value = member.name;
  nameCell.font = { bold: true, size: 13, color: { argb: "FF374151" } };
  nameCell.alignment = { horizontal: "center" };

  sheet.mergeCells("A3:E3");
  const infoCell = sheet.getCell("A3");
  infoCell.value = `${member.email} | ${member.phone} | ${member.address}`;
  infoCell.font = { size: 10, color: { argb: "FF6B7280" } };
  infoCell.alignment = { horizontal: "center" };

  sheet.mergeCells("A4:E4");
  const dateCell = sheet.getCell("A4");
  dateCell.value = `Statement generated on ${new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}`;
  dateCell.font = { size: 10, italic: true, color: { argb: "FF9CA3AF" } };
  dateCell.alignment = { horizontal: "center" };

  // --- Summary Row ---
  const summaryRow = 6;
  sheet.getCell(`A${summaryRow}`).value = "Savings Balance";
  sheet.getCell(`A${summaryRow}`).font = { bold: true, size: 10 };
  sheet.getCell(`B${summaryRow}`).value = savingsBalance;
  sheet.getCell(`B${summaryRow}`).numFmt = "₱#,##0.00";
  sheet.getCell(`B${summaryRow}`).font = { bold: true, size: 10 };

  sheet.getCell(`C${summaryRow}`).value = "Total Deposits";
  sheet.getCell(`C${summaryRow}`).font = { bold: true, size: 10 };
  sheet.getCell(`D${summaryRow}`).value = deposits;
  sheet.getCell(`D${summaryRow}`).numFmt = "₱#,##0.00";
  sheet.getCell(`D${summaryRow}`).font = { bold: true, size: 10 };

  // --- Transaction Table ---
  const tableStartRow = 8;

  sheet.columns = [
    { key: "date", width: 18 },
    { key: "type", width: 16 },
    { key: "description", width: 40 },
    { key: "amount", width: 18 },
    { key: "recordedBy", width: 22 },
  ];

  // Table headers
  const headers = ["Date", "Type", "Description", "Amount (PHP)", "Recorded By"];
  const headerRow = sheet.getRow(tableStartRow);
  headers.forEach((header, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F2937" },
    };
    cell.alignment = { horizontal: i === 3 ? "right" : "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
    };
  });

  // Transaction rows
  let runningBalance = 0;
  // Process in chronological order for running balance, then reverse for display
  const sortedTransactions = [...member.transactions].reverse();

  for (let i = 0; i < sortedTransactions.length; i++) {
    const txn = sortedTransactions[i];
    const isCredit = txn.type === "DEPOSIT" || txn.type === "LOAN_PAYMENT";

    if (txn.type === "DEPOSIT") runningBalance += txn.amount;
    else if (txn.type === "WITHDRAWAL") runningBalance -= txn.amount;

    const row = sheet.getRow(tableStartRow + 1 + i);

    row.getCell(1).value = new Date(txn.createdAt).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    row.getCell(1).font = { size: 10, color: { argb: "FF6B7280" } };

    const typeLabels: Record<string, string> = {
      DEPOSIT: "Deposit",
      WITHDRAWAL: "Withdrawal",
      LOAN_RELEASE: "Loan Release",
      LOAN_PAYMENT: "Loan Payment",
    };
    row.getCell(2).value = typeLabels[txn.type] || txn.type;
    row.getCell(2).font = { size: 10 };

    row.getCell(3).value = txn.description || "";
    row.getCell(3).font = { size: 10, color: { argb: "FF6B7280" } };

    row.getCell(4).value = txn.amount;
    row.getCell(4).numFmt = isCredit ? "+₱#,##0.00" : "-₱#,##0.00";
    row.getCell(4).font = {
      size: 10,
      bold: true,
      color: { argb: isCredit ? "FF16A34A" : "FFDC2626" },
    };
    row.getCell(4).alignment = { horizontal: "right" };

    row.getCell(5).value = txn.recordedBy.name;
    row.getCell(5).font = { size: 10, color: { argb: "FF6B7280" } };

    // Alternate row shading
    if (i % 2 === 1) {
      for (let c = 1; c <= 5; c++) {
        row.getCell(c).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9FAFB" },
        };
      }
    }
  }

  // --- Footer summary ---
  const footerRow = tableStartRow + 1 + member.transactions.length + 1;
  sheet.getCell(`C${footerRow}`).value = "Total Transactions:";
  sheet.getCell(`C${footerRow}`).font = { bold: true, size: 10 };
  sheet.getCell(`C${footerRow}`).alignment = { horizontal: "right" };
  sheet.getCell(`D${footerRow}`).value = member.transactions.length;
  sheet.getCell(`D${footerRow}`).font = { bold: true, size: 10 };
  sheet.getCell(`D${footerRow}`).alignment = { horizontal: "right" };

  const safeName = member.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=statement-${safeName}-${new Date().toISOString().split("T")[0]}.xlsx`,
    },
  });
}
