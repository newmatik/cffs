"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MemberCombobox, type Member } from "@/components/member-combobox";
import { toast } from "sonner";

export function NewTransactionForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      userId: selectedUserId,
      type: formData.get("type") as string,
      amount: parseFloat(formData.get("amount") as string),
      description: formData.get("description") as string,
    };

    if (!data.userId || !data.type || !data.amount || data.amount <= 0) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to record transaction");
      }

      toast.success("Transaction recorded successfully");
      router.push("/transactions");
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

      <div className="space-y-2">
        <Label htmlFor="type">Transaction Type</Label>
        <Select name="type" required>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEPOSIT">Deposit</SelectItem>
            <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (PHP)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="1"
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="e.g., Monthly contribution - February 2026"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Recording..." : "Record Transaction"}
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
