"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function ExportStatementButton({ memberId, memberName }: { memberId: string; memberName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/members/${memberId}/statement`);
      if (!res.ok) throw new Error("Failed to generate statement");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = memberName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      a.download = `statement-${safeName}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Statement downloaded");
    } catch {
      toast.error("Failed to download statement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} variant="outline" size="sm">
      <Download className="w-4 h-4 mr-2" />
      {loading ? "Generating..." : "Export Statement"}
    </Button>
  );
}
