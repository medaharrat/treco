import React from "react";
import { Icon, type IconName } from "./Icons.js";

export function EmptyState({ title, description, icon = "leaf" }: { title: string; description: string; icon?: IconName }) {
  return (
    <div className="af-empty">
      <div className="af-empty-icon">
        <Icon name={icon} size={20} strokeWidth={1.8} />
      </div>
      <div style={{ fontWeight: 600, color: "var(--af-text-primary)" }}>{title}</div>
      <div style={{ fontSize: 13, maxWidth: 320 }}>{description}</div>
    </div>
  );
}
