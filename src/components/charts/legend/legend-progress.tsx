"use client";

import { cn } from "@/lib/utils";
import { useLegendItem } from "./legend-context";

export interface LegendProgressProps {
  /** Track class name */
  trackClassName?: string;
  /** Indicator class name */
  indicatorClassName?: string;
  /** Track height. Default: "h-1.5" */
  height?: string;
}

export function LegendProgress({
  trackClassName = "",
  indicatorClassName = "",
  height = "h-1.5",
}: LegendProgressProps) {
  const { item, percentage } = useLegendItem();

  if (!item.maxValue) {
    return null;
  }

  // Note: item.color must remain inline style as it's dynamic data
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-white/10",
        height,
        trackClassName
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          indicatorClassName
        )}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: item.color }}
      />
    </div>
  );
}

LegendProgress.displayName = "LegendProgress";