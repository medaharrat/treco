import React from "react";

export type IconName =
  | "leaf"
  | "sprout"
  | "droplet"
  | "cloud"
  | "bolt"
  | "globe"
  | "tree"
  | "recycle"
  | "thermometer"
  | "grid"
  | "layers"
  | "clock"
  | "sparkle"
  | "target"
  | "settings"
  | "shield"
  | "chart"
  | "mail"
  | "file"
  | "arrowLeft"
  | "chevronRight"
  | "external";

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  leaf: (
    <path d="M20 4C10 4 4 10 4 18c0 1.2.15 2.3.44 3.3C13 20 19 14.5 19 7.5M4 21 12 13" strokeLinecap="round" strokeLinejoin="round" />
  ),
  sprout: (
    <>
      <path d="M7 20h10M12 20v-8" strokeLinecap="round" />
      <path d="M12 12C12 7 8 5 4 5c0 4.5 3 7 8 7Z" strokeLinejoin="round" />
      <path d="M12 10c0-3.5 2.5-6 7-6 0 3.5-2 6-7 6Z" strokeLinejoin="round" />
    </>
  ),
  droplet: <path d="M12 3s6.5 7.1 6.5 11.5a6.5 6.5 0 1 1-13 0C5.5 10.1 12 3 12 3Z" strokeLinejoin="round" strokeLinecap="round" />,
  cloud: (
    <path
      d="M7 18h9.5a3.75 3.75 0 0 0 .5-7.47A5.5 5.5 0 0 0 6.6 9.55 4 4 0 0 0 7 18Z"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" strokeLinejoin="round" strokeLinecap="round" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.7 9.5h16.6M3.7 14.5h16.6M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5Z" />
    </>
  ),
  tree: (
    <>
      <path d="M12 21v-6" strokeLinecap="round" />
      <path d="M12 15c-3.5 0-6-2.3-6-5.3C6 6.8 8.7 4 12 3c3.3 1 6 3.8 6 6.7 0 3-2.5 5.3-6 5.3Z" strokeLinejoin="round" />
    </>
  ),
  recycle: (
    <path
      d="m7 5.5-2.5 4.3L2 8.3M4.5 9.8l3.4 5.9M17 5.5l2.5 4.3-2.4.9M19.5 9.8 16 15.8m-.7 2.7h-6.6l1.5-2.6M9.3 18.5l-2.4-4.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  thermometer: (
    <path
      d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0Z"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </>
  ),
  layers: (
    <path
      d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3ZM3.5 12 12 16.5 20.5 12M3.5 16.5 12 21l8.5-4.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  sparkle: (
    <path
      d="M12 3.5c.5 3 2 5 5 5.5-3 .5-4.5 2.5-5 5.5-.5-3-2-5-5-5.5 3-.5 4.5-2.5 5-5.5ZM19 15.5c.3 1.4.9 2.3 2.3 2.6-1.4.3-2 1.2-2.3 2.6-.3-1.4-.9-2.3-2.3-2.6 1.4-.3 2-1.2 2.3-2.6Z"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.4-2-3.4-2.2.7a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.4a7.7 7.7 0 0 0-2.6 1.5l-2.2-.7-2 3.4L4.6 10.5a7.6 7.6 0 0 0 0 3L2.7 15l2 3.4 2.2-.7c.75.65 1.63 1.16 2.6 1.5l.5 2.4h4l.5-2.4a7.7 7.7 0 0 0 2.6-1.5l2.2.7 2-3.4-1.9-1.5Z" strokeLinejoin="round" />
    </>
  ),
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" strokeLinejoin="round" strokeLinecap="round" />,
  chart: <path d="M4 19V9M12 19V5M20 19v-7" strokeLinecap="round" />,
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2.4" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 3.5V8h4M8.5 12.5h7M8.5 16h7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  arrowLeft: <path d="M19 12H5M5 12l6-6M5 12l6 6" strokeLinecap="round" strokeLinejoin="round" />,
  chevronRight: <path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />,
  external: (
    <>
      <path d="M9 5h10v10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 5 9 15" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
};

export function Icon({ name, size = 18, strokeWidth = 1.8, className }: IconProps) {
  return (
    <svg
      className={`af-icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
