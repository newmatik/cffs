import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatCurrency, formatDate, getTransactionLabel } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Search,
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Hash,
} from "lucide-react";
import { ExportTransactionsButton } from "./export-transactions-button";
import { TransactionPeriodFilter } from "./transaction-period-filter";
import { Suspense } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";

function getDateRange(params: {
  period?: string;
  month?: string;
  year?: string;
}): { start?: Date; end?: Date; label: string } {
  const now = new Date();

  if (params.period === "week") {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return {
      start,
      end,
      label: `This Week (${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")})`,
    };
  }

  if (params.period === "all") {
    return { label: "All Time" };
  }

  if (params.month && params.year) {
    const monthNum = parseInt(params.month);
    const yearNum = parseInt(params.year);
    const date = new Date(yearNum, monthNum - 1, 1);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      label: format(date, "MMMM yyyy"),
    };
  }

  if (params.year) {
    const yearNum = parseInt(params.year);
    const date = new Date(yearNum, 0, 1);
    return {
      start: startOfYear(date),
      end: endOfYear(date),
      label: yearNum.toString(),
    };
  }

  // Default: all time
  return { label: "All Time" };
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    period?: string;
    month?: string;
    year?: string;
  }>;
}) {
  await requireRole(["ADMIN", "OFFICER"]);

  const params = await searchParams;
  const query = params.q || "";
  const typeFilter = params.type || "";
  const dateRange = getDateRange(params);

  const dateFilter = dateRange.start
    ? {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }
    : {};

  const transactions = await prisma.transaction.findMany({
    where: {
      ...dateFilter,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(query
        ? {
            OR: [
              { user: { name: { contains: query } } },
              { description: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      user: true,
      recordedBy: true,
      loan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute summary stats from filtered transactions
  const totalDeposits = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLoanPayments = transactions
    .filter((t) => t.type === "LOAN_PAYMENT")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLoanReleases = transactions
    .filter((t) => t.type === "LOAN_RELEASE")
    .reduce((sum, t) => sum + t.amount, 0);

  const netFlow =
    totalDeposits + totalLoanPayments - totalWithdrawals - totalLoanReleases;

  const types = ["DEPOSIT", "WITHDRAWAL", "LOAN_RELEASE", "LOAN_PAYMENT"];

  return (
    <div>
      <PageHeader
        title="Transactions"
        description={`${transactions.length} transaction${transactions.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/transactions/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Record Transaction
            </Button>
          </Link>
        }
      />

      {/* Period Filter */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <Suspense fallback={null}>
            <TransactionPeriodFilter />
          </Suspense>
        </CardContent>
      </Card>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  Deposits
                </p>
                <p className="text-lg font-bold text-green-600 truncate">
                  {formatCurrency(totalDeposits)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  Withdrawals
                </p>
                <p className="text-lg font-bold text-red-600 truncate">
                  {formatCurrency(totalWithdrawals)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <ArrowUpDown className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  Net Flow
                </p>
                <p
                  className={`text-lg font-bold truncate ${netFlow >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {netFlow >= 0 ? "+" : ""}
                  {formatCurrency(netFlow)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Hash className="w-4 h-4 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  Transactions
                </p>
                <p className="text-lg font-bold truncate">
                  {transactions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period label */}
      <p className="text-xs text-muted-foreground mb-3">
        Showing: <span className="font-medium">{dateRange.label}</span>
      </p>

      {/* Search & Type Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <form className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Search by member name or description..."
                defaultValue={query}
                className="pl-10"
              />
              {/* Preserve filter params in form submission */}
              {params.period && (
                <input type="hidden" name="period" value={params.period} />
              )}
              {params.month && (
                <input type="hidden" name="month" value={params.month} />
              )}
              {params.year && (
                <input type="hidden" name="year" value={params.year} />
              )}
              {typeFilter && (
                <input type="hidden" name="type" value={typeFilter} />
              )}
            </form>
            <div className="flex gap-2 flex-wrap">
              <Link
                href={`/transactions?${buildFilterParams(params, "")}`}
              >
                <Button
                  variant={!typeFilter ? "default" : "outline"}
                  size="sm"
                >
                  All
                </Button>
              </Link>
              {types.map((type) => (
                <Link
                  key={type}
                  href={`/transactions?${buildFilterParams(params, type)}`}
                >
                  <Button
                    variant={typeFilter === type ? "default" : "outline"}
                    size="sm"
                  >
                    {getTransactionLabel(type)}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recorded By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
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
                    <Badge
                      variant={
                        txn.type === "DEPOSIT"
                          ? "default"
                          : txn.type === "WITHDRAWAL"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {getTransactionLabel(txn.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {txn.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {txn.recordedBy.name}
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
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No transactions found
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

/** Build query params preserving date filters when changing type filter */
function buildFilterParams(
  params: {
    q?: string;
    period?: string;
    month?: string;
    year?: string;
  },
  type: string
): string {
  const sp = new URLSearchParams();
  if (type) sp.set("type", type);
  if (params.q) sp.set("q", params.q);
  if (params.period) sp.set("period", params.period);
  if (params.month) sp.set("month", params.month);
  if (params.year) sp.set("year", params.year);
  return sp.toString();
}
