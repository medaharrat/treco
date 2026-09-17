import React, { useId, useState } from "react";

export interface LineChartPoint {
  x: number; // bucketStart, epoch ms
  y: number;
  label: string;
}

/**
 * A small, dependency-free SVG line/area chart. Deliberately simple: no
 * external charting library, so the extension bundle stays lean and the
 * visuals stay consistent with the rest of the restrained design system.
 */
export function LineChart({ points, height = 160, valueFormatter }: { points: LineChartPoint[]; height?: number; valueFormatter: (n: number) => string }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const width = 100; // percentage-based viewBox; scales via CSS width:100%

  if (points.length === 0) {
    return <div className="af-muted">Not enough data yet.</div>;
  }

  const maxY = Math.max(...points.map((p) => p.y), 1);
  const minY = 0;
  const stepX = points.length > 1 ? width / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : width / 2;
    const y = height - ((p.y - minY) / (maxY - minY || 1)) * (height - 24) - 4;
    return { x, y, point: p };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${linePath} L ${coords[coords.length - 1]?.x ?? 0} ${height} L ${coords[0]?.x ?? 0} ${height} Z`;

  const active = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block", overflow: "visible" }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--af-accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--af-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--af-accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => (
          <rect
            key={i}
            x={c.x - stepX / 2}
            y={0}
            width={stepX || width}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}
        {active && <circle cx={active.x} cy={active.y} r="2.2" fill="var(--af-accent)" vectorEffect="non-scaling-stroke" />}
      </svg>
      {active && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: `${(active.x / width) * 100}%`,
            transform: "translate(-50%, -110%)",
            background: "var(--af-text-primary)",
            color: "var(--af-bg-elevated)",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 8px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            pointerEvents: "none"
          }}
        >
          {active.point.label}: {valueFormatter(active.point.y)}
        </div>
      )}
    </div>
  );
}
