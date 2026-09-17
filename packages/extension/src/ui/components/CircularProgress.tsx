import React from "react";

export function CircularProgress({
  ratio,
  size = 56,
  strokeWidth = 6,
  warn = false,
  label
}: {
  ratio: number;
  size?: number;
  strokeWidth?: number;
  warn?: boolean;
  label?: string;
}) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <span className="af-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="af-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className={`af-ring-fill${warn || ratio > 1 ? " warn" : ""}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {label && (
        <span className="af-ring-label" style={{ fontSize: size / 4.2 }}>
          {label}
        </span>
      )}
    </span>
  );
}
