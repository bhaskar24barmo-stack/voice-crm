import type { CSSProperties } from "react";

// Voice CRM mark: an orange "C" wrapped around a sound wave.
// mode "intro": the C draws itself and the bars pop in (plays once). "live": bars keep dancing (loaders). "static": no motion.
// With `hover`, the bars dance while the logo is hovered or pressed.
const BARS = [{ x: 25, h: 13 }, { x: 37.75, h: 23 }, { x: 50.5, h: 49 }, { x: 63.25, h: 33 }, { x: 76, h: 24 }];

export default function LogoMark({ size = 32, tile = "dark", mode = "intro", hover = true, className = "" }: { size?: number; tile?: "dark" | "light" | "none"; mode?: "static" | "intro" | "live"; hover?: boolean; className?: string }) {
  const bar = tile === "dark" ? "#F7F5F0" : "#191919";
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Voice CRM" className={`logo ${mode === "intro" ? "logo-intro" : mode === "live" ? "logo-live" : ""} ${hover ? "logo-hover" : ""} ${className}`}>
      {tile !== "none" && <rect width="120" height="120" rx="28" fill={tile === "dark" ? "#141414" : "#F3EBDD"} />}
      <g transform="translate(15 0)">
        <path className="logo-arc" pathLength={100} d="M77.7 35.9 A37.5 37.5 0 1 0 77.7 84.1" fill="none" stroke="#C2501A" strokeWidth="11" strokeLinecap="round" />
        {BARS.map((b, i) => <rect key={i} className="logo-bar" style={{ "--i": i } as CSSProperties} x={b.x} y={60 - b.h / 2} width="8" height={b.h} rx="4" fill={bar} />)}
      </g>
    </svg>
  );
}
