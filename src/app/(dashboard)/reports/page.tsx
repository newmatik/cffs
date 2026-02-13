import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReportButtons } from "./report-buttons";
import { FileSpreadsheet, Users, Landmark, TrendingUp } from "lucide-react";

export default async function ReportsPage() {
  await requireRole(["ADMIN", "OFFICER"]);

  const reports = [
    {
      id: "transactions",
      title: "All Transactions",
      description: "Complete list of all deposits, withdrawals, loan releases, and loan payments",
      icon: FileSpreadsheet,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      id: "balances",
      title: "Member Balances",
      description: "Summary of all member savings balances",
      icon: Users,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      id: "loans",
      title: "Loan Summary",
      description: "Overview of all loans with outstanding balances and payment status",
      icon: Landmark,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-50",
    },
    {
      id: "collections",
      title: "Monthly Collections",
      description: "Deposits and loan payments grouped by month",
      icon: TrendingUp,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Generate and download Excel reports"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${report.iconBg}`}>
                  <report.icon className={`w-6 h-6 ${report.iconColor}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {report.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ReportButtons reportType={report.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
