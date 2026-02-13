"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface LoanActionsProps {
  loan: {
    id: string;
    status: string;
    userId: string;
    amount: number;
  };
}

export function LoanActions({ loan }: LoanActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  async function handleAction(action: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${loan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }

      toast.success(
        action === "approve"
          ? "Loan approved and disbursed"
          : action === "reject"
            ? "Loan rejected"
            : "Action completed"
      );
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: loan.userId,
          type: "LOAN_PAYMENT",
          amount,
          description: `Loan payment`,
          loanId: loan.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment failed");
      }

      toast.success("Loan payment recorded");
      setPaymentAmount("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (loan.status === "PENDING") {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          This loan is awaiting approval.
        </p>
        <Button
          className="w-full"
          onClick={() => handleAction("approve")}
          disabled={loading}
        >
          {loading ? "Processing..." : "Approve & Disburse"}
        </Button>
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => handleAction("reject")}
          disabled={loading}
        >
          Reject
        </Button>
      </div>
    );
  }

  if (loan.status === "ACTIVE") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Record a payment for this loan.
        </p>
        <form onSubmit={handlePayment} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount (PHP)</Label>
            <Input
              id="paymentAmount"
              type="number"
              step="0.01"
              min="1"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      This loan is {loan.status.toLowerCase()}. No actions available.
    </p>
  );
}
