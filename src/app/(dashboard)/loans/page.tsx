import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatCurrency, formatDate, getLoanStatusLabel } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus } from "lucide-react";

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole(["ADMIN", "OFFICER"]);

  const params = await searchParams;
  const statusFilter = params.status || "";

  const loans = await prisma.loan.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: {
      user: true,
      approvedBy: true,
      transactions: true,
    },
    orderBy: { appliedAt: "desc" },
  });

  const statuses = ["PENDING", "ACTIVE", "PAID", "REJECTED"];

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PAID":
        return "secondary";
      case "PENDING":
        return "outline";
      case "REJECTED":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div>
      <PageHeader
        title="Loans"
        description={`${loans.length} loan${loans.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/loans/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Loan Application
            </Button>
          </Link>
        }
      />

      {/* Status Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 flex-wrap">
            <Link href="/loans">
              <Button
                variant={!statusFilter ? "default" : "outline"}
                size="sm"
              >
                All
              </Button>
            </Link>
            {statuses.map((status) => (
              <Link key={status} href={`/loans?status=${status}`}>
                <Button
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                >
                  {getLoanStatusLabel(status)}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loans Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Applied</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.map((loan) => {
                const paid = loan.transactions
                  .filter((t) => t.type === "LOAN_PAYMENT")
                  .reduce((s, t) => s + t.amount, 0);
                const remaining = loan.totalDue - paid;
                return (
                  <TableRow key={loan.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(loan.appliedAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/members/${loan.userId}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {loan.user.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {loan.purpose}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(loan.amount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {loan.interestRate}%
                    </TableCell>
                    <TableCell className="text-sm">
                      {loan.termMonths} mo
                    </TableCell>
                    <TableCell className="font-medium">
                      {loan.status === "ACTIVE"
                        ? formatCurrency(remaining)
                        : loan.status === "PAID"
                          ? formatCurrency(0)
                          : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(loan.status) as "default" | "secondary" | "outline" | "destructive"}>
                        {getLoanStatusLabel(loan.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {loans.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No loans found
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
