import React from "react";

export function Card({ children, className = "", small = false }: { children: React.ReactNode; className?: string; small?: boolean }) {
  return <div className={`af-card ${small ? "af-card-sm" : ""} ${className}`}>{children}</div>;
}
