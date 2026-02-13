import { format, formatDistanceToNow } from "date-fns";

export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), "MMM d, yyyy h:mm a");
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getTransactionLabel(type: string): string {
  const labels: Record<string, string> = {
    DEPOSIT: "Deposit",
    WITHDRAWAL: "Withdrawal",
    LOAN_RELEASE: "Loan Release",
    LOAN_PAYMENT: "Loan Payment",
  };
  return labels[type] || type;
}

export function getLoanStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    ACTIVE: "Active",
    PAID: "Paid",
    REJECTED: "Rejected",
  };
  return labels[status] || status;
}
