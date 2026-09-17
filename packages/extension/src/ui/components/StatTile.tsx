import React from "react";
import { Icon, type IconName } from "./Icons.js";

export function StatTile({ value, label, large = false, icon }: { value: string; label: string; large?: boolean; icon?: IconName }) {
  return (
    <div className={`af-stat ${large ? "af-stat-lg" : ""}`}>
      {icon && (
        <span className="af-stat-icon">
          <Icon name={icon} size={15} strokeWidth={2} />
        </span>
      )}
      <div className="af-stat-value">{value}</div>
      <div className="af-stat-label">{label}</div>
    </div>
  );
}
