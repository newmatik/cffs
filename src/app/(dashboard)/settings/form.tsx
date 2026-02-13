"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SettingsFormProps {
  settings: Record<string, string>;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [defaultInterestRate, setDefaultInterestRate] = useState(settings.defaultInterestRate);
  const [maxLoanAmount, setMaxLoanAmount] = useState(settings.maxLoanAmount);
  const [minLoanAmount, setMinLoanAmount] = useState(settings.minLoanAmount);
  const [maxTermMonths, setMaxTermMonths] = useState(settings.maxTermMonths);
  const [minTermMonths, setMinTermMonths] = useState(settings.minTermMonths);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    // Client-side validation
    const minAmount = parseFloat(minLoanAmount);
    const maxAmount = parseFloat(maxLoanAmount);
    const minTerm = parseInt(minTermMonths);
    const maxTerm = parseInt(maxTermMonths);

    if (minAmount >= maxAmount) {
      toast.error("Minimum loan amount must be less than maximum");
      setLoading(false);
      return;
    }

    if (minTerm >= maxTerm) {
      toast.error("Minimum term must be less than maximum");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultInterestRate,
          maxLoanAmount,
          minLoanAmount,
          maxTermMonths,
          minTermMonths,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save settings");
      }

      toast.success("Settings saved successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Interest Rate */}
      <div className="space-y-2">
        <Label htmlFor="defaultInterestRate">Default Interest Rate (% per annum)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="defaultInterestRate"
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={defaultInterestRate}
            onChange={(e) => setDefaultInterestRate(e.target.value)}
            className="max-w-[200px]"
            required
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          This rate will be pre-filled when creating new loan applications.
        </p>
      </div>

      {/* Loan Amount Limits */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Loan Amount Limits (PHP)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minLoanAmount">Minimum Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                id="minLoanAmount"
                type="number"
                step="100"
                min="0"
                value={minLoanAmount}
                onChange={(e) => setMinLoanAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLoanAmount">Maximum Amount</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                id="maxLoanAmount"
                type="number"
                step="100"
                min="0"
                value={maxLoanAmount}
                onChange={(e) => setMaxLoanAmount(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Term Limits */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Loan Term Limits</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minTermMonths">Minimum Term</Label>
            <div className="flex items-center gap-2">
              <Input
                id="minTermMonths"
                type="number"
                min="1"
                max="120"
                value={minTermMonths}
                onChange={(e) => setMinTermMonths(e.target.value)}
                required
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">months</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTermMonths">Maximum Term</Label>
            <div className="flex items-center gap-2">
              <Input
                id="maxTermMonths"
                type="number"
                min="1"
                max="120"
                value={maxTermMonths}
                onChange={(e) => setMaxTermMonths(e.target.value)}
                required
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">months</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
