import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatCurrency, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["ADMIN", "OFFICER"]);

  const params = await searchParams;
  const query = params.q || "";

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
              { phone: { contains: query } },
            ],
          }
        : {}),
    },
    include: {
      transactions: true,
    },
    orderBy: { name: "asc" },
  });

  const membersWithBalance = members.map((member) => {
    const deposits = member.transactions
      .filter((t) => t.type === "DEPOSIT")
      .reduce((sum, t) => sum + t.amount, 0);
    const withdrawals = member.transactions
      .filter((t) => t.type === "WITHDRAWAL")
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      ...member,
      savingsBalance: deposits - withdrawals,
    };
  });

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${members.length} registered member${members.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/members/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Member
            </Button>
          </Link>
        }
      />

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search by name, email, or phone..."
              defaultValue={query}
              className="pl-10"
            />
          </form>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Savings Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersWithBalance.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link
                      href={`/members/${member.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {member.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell className="text-sm">{member.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(member.joinedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.active ? "default" : "secondary"}>
                      {member.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span
                      className={
                        member.savingsBalance >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {formatCurrency(member.savingsBalance)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {membersWithBalance.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    {query ? "No members match your search" : "No members yet"}
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
