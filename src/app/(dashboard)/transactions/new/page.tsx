import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NewTransactionForm } from "./form";

export default async function NewTransactionPage() {
  await requireRole(["ADMIN", "OFFICER"]);

  const members = await prisma.user.findMany({
    where: { role: "MEMBER", active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <PageHeader
        title="Record Transaction"
        description="Record a deposit or withdrawal for a member"
        action={
          <Link href="/transactions">
            <Button variant="outline" size="sm">
              Back to Transactions
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewTransactionForm members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
