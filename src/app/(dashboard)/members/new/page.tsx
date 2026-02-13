import { requireRole } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { NewMemberForm } from "./form";

export default async function NewMemberPage() {
  await requireRole(["ADMIN", "OFFICER"]);

  return (
    <div>
      <PageHeader
        title="New Member"
        description="Register a new church member"
        action={
          <Link href="/members">
            <Button variant="outline" size="sm">
              Back to Members
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewMemberForm />
        </CardContent>
      </Card>
    </div>
  );
}
