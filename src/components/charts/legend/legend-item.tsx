"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useLegend, useLegendItem } from "./legend-context";

export interface LegendItemProps {
  /** Container class name */
  className?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Children components (LegendMarker, LegendLabel, LegendValue, LegendProgress) */
  children: ReactNode;
}

export function LegendItem({
  className = "",
  onClick,
  children,
}: LegendItemProps) {
  const { setHoveredIndex } = useLegend();
  const { index, isHovered } = useLegendItem();

  return (
    // biome-ignore lint/a11y/noNoninteractiveElementInteractions: Legend item hover interaction
    // biome-ignore lint/a11y/noStaticElementInteractions: Legend item hover interaction
    <div
      className={cn(
        "cursor-pointer rounded-lg px-2 py-1.5 transition-all duration-150 ease-out",
        isHovered && "bg-white/5",
        className
      )}
      data-hovered={isHovered ? "" : undefined}
      onClick={onClick}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {children}
    </div>
  );
}

LegendItem.displayName = "LegendItem";
