import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { notFound } from "next/navigation";
import {
  formatCurrency,
  formatDate,
  getTransactionLabel,
  getLoanStatusLabel,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsCard } from "@/components/stats-card";
import { Wallet, TrendingUp, Landmark, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExportStatementButton } from "./export-statement-button";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "OFFICER"]);
  const { id } = await params;

  const member = await prisma.user.findUnique({
    where: { id },
    include: {
      transactions: {
        include: { loan: true, recordedBy: true },
        orderBy: { createdAt: "desc" },
      },
      loans: {
        include: { transactions: true },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!member) return notFound();

  const deposits = member.transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const withdrawals = member.transactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsBalance = deposits - withdrawals;

  const totalLoanPayments = member.transactions
    .filter((t) => t.type === "LOAN_PAYMENT")
    .reduce((sum, t) => sum + t.amount, 0);

  const activeLoans = member.loans.filter((l) => l.status === "ACTIVE");
  const totalOutstanding = activeLoans.reduce((sum, l) => {
    const paid = l.transactions
      .filter((t) => t.type === "LOAN_PAYMENT")
      .reduce((s, t) => s + t.amount, 0);
    return sum + (l.totalDue - paid);
  }, 0);

  return (
    <div>
      <PageHeader
        title={member.name}
        description={`${member.email} | ${member.phone} | ${member.address}`}
        action={
          <div className="flex items-center gap-2">
            <ExportStatementButton memberId={id} memberName={member.name} />
            <Link href="/members">
              <Button variant="outline" size="sm">
                Back to Members
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Savings Balance"
          value={formatCurrency(savingsBalance)}
          icon={Wallet}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatsCard
          title="Total Deposits"
          value={formatCurrency(deposits)}
          icon={TrendingUp}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Loan Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtitle={`${activeLoans.length} active loan${activeLoans.length !== 1 ? "s" : ""}`}
          icon={Landmark}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatsCard
          title="Total Transactions"
          value={member.transactions.length.toString()}
          subtitle={`Joined ${formatDate(member.joinedAt)}`}
          icon={ArrowLeftRight}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loans */}
        <Card>
          <CardHeader>
            <CardTitle>Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {member.loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No loans</p>
            ) : (
              <div className="space-y-3">
                {member.loans.map((loan) => {
                  const paid = loan.transactions
                    .filter((t) => t.type === "LOAN_PAYMENT")
                    .reduce((s, t) => s + t.amount, 0);
                  const remaining = loan.totalDue - paid;
                  return (
                    <Link
                      key={loan.id}
                      href={`/loans/${loan.id}`}
                      className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {formatCurrency(loan.amount)}
                        </span>
                        <Badge
                          variant={
                            loan.status === "ACTIVE"
                              ? "default"
                              : loan.status === "PAID"
                                ? "secondary"
                                : loan.status === "PENDING"
                                  ? "outline"
                                  : "destructive"
                          }
                        >
                          {getLoanStatusLabel(loan.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {loan.purpose}
                      </p>
                      {loan.status === "ACTIVE" && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Remaining</span>
                            <span>{formatCurrency(remaining)}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{
                                width: `${Math.min(100, (paid / loan.totalDue) * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.transactions.slice(0, 20).map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(txn.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge
                          variant={
                            txn.type === "DEPOSIT"
                              ? "default"
                              : txn.type === "WITHDRAWAL"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {getTransactionLabel(txn.type)}
                        </Badge>
                        {txn.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                            {txn.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span
                        className={
                          txn.type === "DEPOSIT" || txn.type === "LOAN_PAYMENT"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {txn.type === "DEPOSIT" || txn.type === "LOAN_PAYMENT"
                          ? "+"
                          : "-"}
                        {formatCurrency(txn.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {member.transactions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No transactions yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
