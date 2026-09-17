import React, { useId, useState } from "react";

export interface LineChartPoint {
  x: number; // bucketStart, epoch ms
  y: number;
  label: string;
}

interface Coord {
  x: number;
  y: number;
  point: LineChartPoint;
}

/** Catmull-Rom to cubic-bezier smoothing, so the line reads as an organic curve rather than sharp segments. */
function smoothPath(coords: Coord[]): string {
  if (coords.length < 3) {
    return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  }
  let d = `M ${coords[0]!.x} ${coords[0]!.y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i]!;
    const p2 = coords[i + 1]!;
    const p0 = coords[i - 1] ?? p1;
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
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

  const coords: Coord[] = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : width / 2;
    const y = height - ((p.y - minY) / (maxY - minY || 1)) * (height - 24) - 4;
    return { x, y, point: p };
  });

  const linePath = smoothPath(coords);
  const last = coords[coords.length - 1];
  const first = coords[0];
  const areaPath = `${linePath} L ${last?.x ?? 0} ${height} L ${first?.x ?? 0} ${height} Z`;

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
            <stop offset="0%" stopColor="var(--af-accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--af-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        <path d={linePath} fill="none" stroke="var(--af-accent-strong)" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
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
      </svg>
      {/*
       * The marker dot and tooltip are plain HTML, positioned by percentage, rather than SVG shapes inside the
       * chart's viewBox: that viewBox is stretched non-uniformly (wide x-scale, fixed y-scale) via
       * preserveAspectRatio="none", so an SVG <circle> there renders as a squashed ellipse, not a dot.
       */}
      {active && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: `${(active.y / height) * 100}%`,
            left: `${(active.x / width) * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--af-bg-elevated)",
            border: "1.6px solid var(--af-accent-strong)",
            pointerEvents: "none"
          }}
        />
      )}
      {active && (
        <div
          style={{
            position: "absolute",
            top: `${(active.y / height) * 100}%`,
            left: `${(active.x / width) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
            background: "var(--af-charcoal)",
            color: "var(--af-cream)",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 9px",
            borderRadius: 8,
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
