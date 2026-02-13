import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./form";

const DEFAULTS: Record<string, string> = {
  defaultInterestRate: "12",
  maxLoanAmount: "100000",
  minLoanAmount: "1000",
  maxTermMonths: "36",
  minTermMonths: "1",
};

export default async function SettingsPage() {
  await requireRole(["ADMIN"]);

  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = { ...DEFAULTS };

  for (const s of settings) {
    settingsMap[s.key] = s.value;
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure system-wide loan terms and limits"
      />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Terms</CardTitle>
            <CardDescription>
              Set the default interest rate and loan term limits. These values will be
              used as defaults when creating new loan applications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settingsMap} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
