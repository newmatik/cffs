import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import {
  formatCurrency,
  formatDate,
  getTransactionLabel,
  getLoanStatusLabel,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatsCard } from "@/components/stats-card";
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
import { Wallet, TrendingUp, Landmark, ArrowLeftRight } from "lucide-react";

export default async function MyAccountPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const member = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        include: { loan: true },
        orderBy: { createdAt: "desc" },
      },
      loans: {
        include: { transactions: true },
        orderBy: { appliedAt: "desc" },
      },
    },
  });

  if (!member) return null;

  const deposits = member.transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);
  const withdrawals = member.transactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + t.amount, 0);
  const savingsBalance = deposits - withdrawals;

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
        title="My Account"
        description={`Welcome, ${member.name}`}
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
          subtitle={`Member since ${formatDate(member.joinedAt)}`}
          icon={ArrowLeftRight}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Loans */}
        <Card>
          <CardHeader>
            <CardTitle>My Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {member.loans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No loans</p>
            ) : (
              <div className="space-y-4">
                {member.loans.map((loan) => {
                  const paid = loan.transactions
                    .filter((t) => t.type === "LOAN_PAYMENT")
                    .reduce((s, t) => s + t.amount, 0);
                  const remaining = loan.totalDue - paid;
                  const progressPct = Math.min(
                    100,
                    (paid / loan.totalDue) * 100
                  );

                  return (
                    <div
                      key={loan.id}
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
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
                      <p className="text-sm text-muted-foreground mb-1">
                        {loan.purpose}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {loan.interestRate}% interest | {loan.termMonths} months
                        | {formatCurrency(loan.monthlyPayment)}/month
                      </p>

                      {loan.status === "ACTIVE" && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>
                              Paid: {formatCurrency(paid)} of{" "}
                              {formatCurrency(loan.totalDue)}
                            </span>
                            <span>Remaining: {formatCurrency(remaining)}</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Payment Schedule */}
                      {loan.status === "ACTIVE" && loan.startDate && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-2">
                            Payment Schedule
                          </p>
                          <div className="space-y-1">
                            {Array.from(
                              { length: loan.termMonths },
                              (_, i) => {
                                const dueDate = new Date(loan.startDate!);
                                dueDate.setMonth(dueDate.getMonth() + i + 1);

                                const payment = loan.transactions
                                  .filter((t) => t.type === "LOAN_PAYMENT")
                                  .sort(
                                    (a, b) =>
                                      new Date(a.createdAt).getTime() -
                                      new Date(b.createdAt).getTime()
                                  )[i];

                                const isPaid = !!payment;
                                const isOverdue =
                                  !isPaid && new Date() > dueDate;

                                return (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      Month {i + 1} -{" "}
                                      {formatDate(dueDate)}
                                    </span>
                                    <span
                                      className={
                                        isPaid
                                          ? "text-green-600"
                                          : isOverdue
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                      }
                                    >
                                      {isPaid
                                        ? "Paid"
                                        : isOverdue
                                          ? "Overdue"
                                          : "Upcoming"}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {member.transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(txn.createdAt)}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                      {txn.description}
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
                      colSpan={4}
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
