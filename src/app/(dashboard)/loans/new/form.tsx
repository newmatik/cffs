"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MemberCombobox, type Member } from "@/components/member-combobox";
import { toast } from "sonner";

interface NewLoanFormProps {
  members: Member[];
  settings: Record<string, string>;
}

export function NewLoanForm({ members, settings }: NewLoanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [interestRate, setInterestRate] = useState(settings.defaultInterestRate || "12");
  const [termMonths, setTermMonths] = useState(settings.minTermMonths || "1");

  const minLoanAmount = parseFloat(settings.minLoanAmount) || 1000;
  const maxLoanAmount = parseFloat(settings.maxLoanAmount) || 100000;
  const minTermMonthsVal = parseInt(settings.minTermMonths) || 1;
  const maxTermMonthsVal = parseInt(settings.maxTermMonths) || 36;

  const computed = useMemo(() => {
    const principal = parseFloat(amount) || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseInt(termMonths) || 1;
    const totalInterest = principal * (rate / 100) * (term / 12);
    const totalDue = principal + totalInterest;
    const monthlyPayment = totalDue / term;
    return { totalInterest, totalDue, monthlyPayment };
  }, [amount, interestRate, termMonths]);

  const formatPHP = (n: number) =>
    `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      userId: selectedUserId,
      amount,
      interestRate,
      termMonths,
      purpose: formData.get("purpose") as string,
    };

    if (!data.userId) {
      toast.error("Please select a member");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create loan");
      }

      toast.success("Loan application created");
      router.push("/loans");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Member</Label>
        <MemberCombobox
          members={members}
          value={selectedUserId}
          onChange={setSelectedUserId}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Loan Amount (PHP)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="100"
            min={minLoanAmount}
            max={maxLoanAmount}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            ₱{minLoanAmount.toLocaleString()} – ₱{maxLoanAmount.toLocaleString()}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interestRate">Interest Rate (% annual)</Label>
          <Input
            id="interestRate"
            name="interestRate"
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="termMonths">Term (months)</Label>
          <Input
            id="termMonths"
            name="termMonths"
            type="number"
            min={minTermMonthsVal}
            max={maxTermMonthsVal}
            value={termMonths}
            onChange={(e) => setTermMonths(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            {minTermMonthsVal} – {maxTermMonthsVal} months
          </p>
        </div>
      </div>

      {/* Computed Preview */}
      {parseFloat(amount) > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium text-blue-900">Loan Summary</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-600">Total Interest</p>
              <p className="font-bold text-blue-900">
                {formatPHP(computed.totalInterest)}
              </p>
            </div>
            <div>
              <p className="text-blue-600">Total Due</p>
              <p className="font-bold text-blue-900">
                {formatPHP(computed.totalDue)}
              </p>
            </div>
            <div>
              <p className="text-blue-600">Monthly Payment</p>
              <p className="font-bold text-blue-900">
                {formatPHP(computed.monthlyPayment)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose</Label>
        <Textarea
          id="purpose"
          name="purpose"
          placeholder="e.g., Small business capital, medical expenses, school tuition"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Loan Application"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
