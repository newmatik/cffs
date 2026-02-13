"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y.toString());
  }
  return years;
}

export function TransactionPeriodFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const period = searchParams.get("period") || "";
  const month = searchParams.get("month") || "";
  const year = searchParams.get("year") || "";

  // Determine active state
  const isThisWeek = period === "week";
  const isAllTime = period === "all";
  const isThisYear = !period && !month && year === currentYear.toString();
  const isThisMonth =
    !period &&
    month === currentMonth.toString() &&
    year === currentYear.toString();
  // Default (no params) = all time
  const isDefault = !period && !month && !year;

  const navigateWith = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      // Clear period-related params first
      params.delete("period");
      params.delete("month");
      params.delete("year");
      // Keep other params (q, type)
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        }
      }
      router.push(`/transactions?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePreset = (preset: string) => {
    switch (preset) {
      case "week":
        navigateWith({ period: "week" });
        break;
      case "month":
        navigateWith({
          month: currentMonth.toString(),
          year: currentYear.toString(),
        });
        break;
      case "year":
        navigateWith({ year: currentYear.toString() });
        break;
      case "all":
        navigateWith({ period: "all" });
        break;
    }
  };

  const handleMonthChange = (value: string) => {
    const y = year || currentYear.toString();
    navigateWith({ month: value, year: y });
  };

  const handleYearChange = (value: string) => {
    if (month) {
      navigateWith({ month, year: value });
    } else {
      navigateWith({ year: value });
    }
  };

  const selectedMonth = month || "";
  const selectedYear = year || "";

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarDays className="w-4 h-4" />
        <span className="font-medium">Period:</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={isThisWeek ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("week")}
        >
          This Week
        </Button>
        <Button
          variant={isThisMonth ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("month")}
        >
          This Month
        </Button>
        <Button
          variant={isThisYear ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("year")}
        >
          This Year
        </Button>
        <Button
          variant={isAllTime || isDefault ? "default" : "outline"}
          size="sm"
          onClick={() => handlePreset("all")}
        >
          All Time
        </Button>
      </div>
      <div className="hidden sm:block w-px h-6 bg-border" />
      <div className="flex gap-2">
        <Select value={selectedMonth} onValueChange={handleMonthChange}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger size="sm" className="w-[100px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {getYearOptions().map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
