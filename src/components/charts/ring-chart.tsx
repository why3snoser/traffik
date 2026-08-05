"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { arc as d3Arc, pie as d3Pie, type PieArcDatum } from "d3-shape";

export interface RingDataItem {
  /** Display label */
  label: string;
  /** Numeric value */
  value: number;
  /** Segment color */
  color: string;
}

interface RingChartProps {
  /** Segments data, drawn in order */
  data: RingDataItem[];
  /** Controlled hovered segment index */
  hoveredIndex?: number | null;
  /** Hover change callback */
  onHoverChange?: (index: number | null) => void;
  /** Ring diameter in px. Default: 180 */
  size?: number;
  /** Arc thickness in px. Default: 18 */
  thickness?: number;
  /** Gap (in px) between segments. Default: 2 */
  gap?: number;
  /** Rounded arc caps. Default: true */
  rounded?: boolean;
  /** Show the faint background track circle. Default: true */
  track?: boolean;
  /** Container class name */
  className?: string;
  /** <Ring/> and <RingCenter/> children */
  children: ReactNode;
}

interface RingContextValue {
  arcs: PieArcDatum<RingDataItem>[];
  innerRadius: number;
  outerRadius: number;
  thickness: number;
  rounded: boolean;
  gap: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}

const RingContext = createContext<RingContextValue | null>(null);

export function useRingChart(): RingContextValue {
  const ctx = useContext(RingContext);
  if (!ctx) throw new Error("useRingChart must be used within <RingChart>");
  return ctx;
}

export function RingChart({
  data,
  hoveredIndex: controlledHoveredIndex,
  onHoverChange,
  size = 180,
  thickness = 18,
  gap = 2,
  rounded = true,
  track = true,
  className = "",
  children,
}: RingChartProps) {
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);
  const hoveredIndex =
    controlledHoveredIndex !== undefined
      ? controlledHoveredIndex
      : internalHoveredIndex;

  const setHoveredIndex = (index: number | null) => {
    if (onHoverChange) {
      onHoverChange(index);
    } else {
      setInternalHoveredIndex(index);
    }
  };

  const center = size / 2;
  const outerRadius = (size - thickness) / 2;
  const innerRadius = outerRadius - thickness;

  const pie = d3Pie<RingDataItem>()
    .sort(null)
    .value((d) => Number(d.value) || 0);
  const arcs = pie(data);

  return (
    <RingContext.Provider
      value={{ arcs, innerRadius, outerRadius, thickness, rounded, gap, hoveredIndex, setHoveredIndex }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("block overflow-visible", className)}
        aria-hidden="true"
      >
        <g transform={`translate(${center},${center}) rotate(-90)`}>
          {track && (
            <circle
              r={outerRadius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={thickness}
            />
          )}
          {children}
          {track && (
            <circle
              r={innerRadius}
              fill="none"
              stroke="transparent"
              strokeWidth={0}
            />
          )}
        </g>
      </svg>
    </RingContext.Provider>
  );
}

RingChart.displayName = "RingChart";

export function Ring({ index }: { index: number }) {
  const { arcs, innerRadius, outerRadius, thickness, rounded, gap, hoveredIndex, setHoveredIndex } =
    useRingChart();
  const arcData = arcs[index];
  if (!arcData || !arcData.value) {
    return null;
  }

  const isHovered = hoveredIndex === index;
  const isFaded = hoveredIndex !== null && hoveredIndex !== index;

  const padAngle = gap > 0 ? gap / outerRadius / 2 : 0;
  // Clamp so the pad never overflows a tiny segment
  const sweep = arcData.endAngle - arcData.startAngle;
  const effectivePad = sweep > padAngle * 2 ? padAngle : 0;

  const generator = d3Arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(isHovered ? outerRadius + thickness * 0.25 : outerRadius)
    .cornerRadius(rounded ? thickness * 0.4 : 0)
    .padAngle(effectivePad);

  const d = generator(arcData as any);
  if (!d) {
    return null;
  }

  return (
    <path
      d={d}
      fill={arcData.data.color}
      style={{
        opacity: isFaded ? 0.3 : 1,
        cursor: "pointer",
        transition: "opacity .3s ease, transform .3s ease",
      }}
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    />
  );
}

Ring.displayName = "Ring";

export function RingCenter({
  value,
  sub,
  defaultLabel,
}: {
  value?: ReactNode;
  sub?: ReactNode;
  defaultLabel?: string;
}) {
  const { outerRadius, innerRadius } = useRingChart();
  const radius = (outerRadius + innerRadius) / 2;
  return (
    <g transform="rotate(90)" textAnchor="middle" dominantBaseline="middle">
      {value !== undefined || defaultLabel !== undefined ? (
        <text
          style={{ fontSize: radius * 0.5, fontWeight: 700, fill: "#fff" }}
        >
          {value ?? defaultLabel}
        </text>
      ) : null}
      {sub ? (
        <text
          y={radius * 0.55}
          style={{ fontSize: radius * 0.24, fontWeight: 600, fill: "#A596E8" }}
        >
          {sub}
        </text>
      ) : null}
    </g>
  );
}

RingCenter.displayName = "RingCenter";

export default RingChart;