import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NewLoanForm } from "./form";

const SETTING_DEFAULTS: Record<string, string> = {
  defaultInterestRate: "12",
  maxLoanAmount: "100000",
  minLoanAmount: "1000",
  maxTermMonths: "36",
  minTermMonths: "1",
};

export default async function NewLoanPage() {
  await requireRole(["ADMIN", "OFFICER"]);

  const [members, settingsRows] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER", active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.setting.findMany(),
  ]);

  const settings: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const s of settingsRows) {
    settings[s.key] = s.value;
  }

  return (
    <div>
      <PageHeader
        title="New Loan Application"
        description="Create a loan application for a member"
        action={
          <Link href="/loans">
            <Button variant="outline" size="sm">
              Back to Loans
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewLoanForm members={members} settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
