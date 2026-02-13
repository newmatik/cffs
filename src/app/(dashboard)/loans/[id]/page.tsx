import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { notFound } from "next/navigation";
import {
  formatCurrency,
  formatDate,
  getLoanStatusLabel,
  getTransactionLabel,
} from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { LoanActions } from "./actions";

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["ADMIN", "OFFICER"]);
  const { id } = await params;

  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      user: true,
      approvedBy: true,
      transactions: {
        include: { recordedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!loan) return notFound();

  const totalPaid = loan.transactions
    .filter((t) => t.type === "LOAN_PAYMENT")
    .reduce((sum, t) => sum + t.amount, 0);
  const remaining = loan.totalDue - totalPaid;
  const progressPct = Math.min(100, (totalPaid / loan.totalDue) * 100);

  // Generate amortization schedule
  const schedule = [];
  if (loan.startDate) {
    const start = new Date(loan.startDate);
    for (let i = 0; i < loan.termMonths; i++) {
      const dueDate = new Date(start);
      dueDate.setMonth(dueDate.getMonth() + i + 1);

      const payment = loan.transactions
        .filter((t) => t.type === "LOAN_PAYMENT")
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )[i];

      schedule.push({
        month: i + 1,
        dueDate,
        amount: loan.monthlyPayment,
        paid: payment ? payment.amount : 0,
        paidDate: payment ? payment.createdAt : null,
        status: payment ? "Paid" : new Date() > dueDate ? "Overdue" : "Upcoming",
      });
    }
  }

  return (
    <div>
      <PageHeader
        title={`Loan - ${loan.user.name}`}
        description={loan.purpose}
        action={
          <Link href="/loans">
            <Button variant="outline" size="sm">
              Back to Loans
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Loan Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Loan Details</CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Principal</p>
                <p className="text-lg font-bold">{formatCurrency(loan.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-lg font-bold">{loan.interestRate}% annual</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="text-lg font-bold">{loan.termMonths} months</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-lg font-bold">
                  {formatCurrency(loan.monthlyPayment)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-lg font-bold">
                  {formatCurrency(loan.totalDue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Applied</p>
                <p className="text-lg font-bold">
                  {formatDate(loan.appliedAt)}
                </p>
              </div>
            </div>

            {loan.status === "ACTIVE" && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>
                    Paid: {formatCurrency(totalPaid)} of{" "}
                    {formatCurrency(loan.totalDue)}
                  </span>
                  <span>Remaining: {formatCurrency(remaining)}</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {loan.approvedBy && (
              <p className="text-sm text-muted-foreground">
                Approved by {loan.approvedBy.name} on{" "}
                {loan.approvedAt ? formatDate(loan.approvedAt) : "N/A"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <LoanActions loan={{
              id: loan.id,
              status: loan.status,
              userId: loan.userId,
              amount: loan.amount,
            }} />
          </CardContent>
        </Card>
      </div>

      {/* Amortization Schedule */}
      {schedule.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount Due</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell>{formatDate(row.dueDate)}</TableCell>
                    <TableCell>{formatCurrency(row.amount)}</TableCell>
                    <TableCell>
                      {row.paid > 0 ? formatCurrency(row.paid) : "-"}
                    </TableCell>
                    <TableCell>
                      {row.paidDate ? formatDate(row.paidDate) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === "Paid"
                            ? "default"
                            : row.status === "Overdue"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(txn.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getTransactionLabel(txn.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {txn.recordedBy.name}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(txn.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {loan.transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
  );
}
