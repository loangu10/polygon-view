"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  dashboardRanges,
  type DashboardRange,
} from "@/lib/dashboard-range";
import { cn } from "@/lib/format";

type RangeSwitcherProps = {
  activeRange: DashboardRange;
  pendingRange: DashboardRange | null;
  onRefreshError: () => void;
  onRefreshStart: (range: DashboardRange) => void;
};

export function RangeSwitcher({
  activeRange,
  pendingRange,
  onRefreshError,
  onRefreshStart,
}: RangeSwitcherProps) {
  const router = useRouter();
  const [selectedRange, setSelectedRange] = useState(activeRange);
  const isRefreshing = pendingRange !== null && pendingRange !== activeRange;

  useEffect(() => {
    setSelectedRange(activeRange);
  }, [activeRange]);

  async function updateRange(nextRange: DashboardRange) {
    if (nextRange === selectedRange || isRefreshing) {
      return;
    }

    setSelectedRange(nextRange);
    onRefreshStart(nextRange);

    try {
      const response = await fetch("/api/range", {
        body: JSON.stringify({ range: nextRange }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        setSelectedRange(activeRange);
        onRefreshError();
        return;
      }

      router.refresh();
    } catch {
      setSelectedRange(activeRange);
      onRefreshError();
    }
  }

  return (
    <div className="inline-flex w-fit flex-wrap items-center gap-1 rounded-full border border-slate-200/70 bg-white/70 p-1 backdrop-blur">
      {dashboardRanges.map((range) => (
        <button
          key={range}
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition",
            selectedRange === range
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            isRefreshing && "opacity-80",
          )}
          disabled={isRefreshing}
          onClick={() => void updateRange(range)}
          type="button"
        >
          {range}d
        </button>
      ))}
    </div>
  );
}
