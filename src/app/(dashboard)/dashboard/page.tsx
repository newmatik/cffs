import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatCurrency, formatDate, getTransactionLabel } from "@/lib/format";
import { StatsCard } from "@/components/stats-card";
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
import { Users, TrendingUp, Landmark, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  await requireRole(["ADMIN", "OFFICER"]);

  const [totalMembers, transactions, loans] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER", active: true } }),
    prisma.transaction.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loan.findMany(),
  ]);

  // Calculate totals
  const totalDeposits = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutstandingLoans = loans
    .filter((l) => l.status === "ACTIVE")
    .reduce((sum, l) => {
      const paid = transactions
        .filter((t) => t.loanId === l.id && t.type === "LOAN_PAYMENT")
        .reduce((s, t) => s + t.amount, 0);
      return sum + (l.totalDue - paid);
    }, 0);

  // Monthly collections (current month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyCollections = transactions
    .filter(
      (t) =>
        (t.type === "DEPOSIT" || t.type === "LOAN_PAYMENT") &&
        new Date(t.createdAt) >= startOfMonth
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = transactions.slice(0, 10);

  const pendingLoans = loans.filter((l) => l.status === "PENDING").length;

  const txnBadgeColor = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return "default";
      case "WITHDRAWAL":
        return "destructive";
      case "LOAN_RELEASE":
        return "secondary";
      case "LOAN_PAYMENT":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of church financial activity"
        action={
          <div className="flex gap-2">
            <Link href="/transactions/new">
              <Button size="sm">Record Transaction</Button>
            </Link>
            {pendingLoans > 0 && (
              <Link href="/loans?status=PENDING">
                <Button size="sm" variant="outline">
                  {pendingLoans} Pending Loan{pendingLoans > 1 ? "s" : ""}
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Members"
          value={totalMembers.toString()}
          subtitle="Active members"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatsCard
          title="Total Deposits"
          value={formatCurrency(totalDeposits)}
          subtitle="All time"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatsCard
          title="Outstanding Loans"
          value={formatCurrency(totalOutstandingLoans)}
          subtitle={`${loans.filter((l) => l.status === "ACTIVE").length} active loans`}
          icon={Landmark}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatsCard
          title="Monthly Collections"
          value={formatCurrency(monthlyCollections)}
          subtitle="This month"
          icon={DollarSign}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(txn.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/members/${txn.userId}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {txn.user.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={txnBadgeColor(txn.type) as "default" | "destructive" | "secondary" | "outline"}>
                      {getTransactionLabel(txn.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
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
              {recentTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
