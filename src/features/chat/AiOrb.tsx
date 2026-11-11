import { useId } from "react";

/** Resolution-independent artwork; motion uses compositor-friendly transforms. */
export function AiOrb({ paused = false, small = false }: { paused?: boolean; small?: boolean }) {
  const id = useId().replace(/:/g, "");
  return <div className={`ai-orb ${paused ? "is-paused" : ""} ${small ? "ai-orb-small" : ""}`} aria-hidden="true">
    <div className="ai-orb-halo" />
    <svg viewBox="0 0 200 200" fill="none" focusable="false">
      <defs>
        <radialGradient id={`${id}-core`} cx=".3" cy=".22" r=".85">
          <stop stopColor="#a9a3ff" /><stop offset=".22" stopColor="#5337c5" />
          <stop offset=".55" stopColor="#14113d" /><stop offset="1" stopColor="#090d26" />
        </radialGradient>
        <linearGradient id={`${id}-ribbon`} x1="30" y1="25" x2="165" y2="175" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c8b9ff" /><stop offset=".2" stopColor="#804dff" />
          <stop offset=".4" stopColor="#10269b" /><stop offset=".57" stopColor="#47d9f5" />
          <stop offset=".7" stopColor="#8356ff" /><stop offset=".86" stopColor="#ec83d1" /><stop offset="1" stopColor="#21134e" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="55" y1="28" x2="138" y2="168" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f0ebff" /><stop offset=".28" stopColor="#b693ff" /><stop offset=".6" stopColor="#40d5fb" /><stop offset="1" stopColor="#dc50c1" />
        </linearGradient>
        <radialGradient id={`${id}-light`}><stop stopColor="#cbccff" stopOpacity=".6" /><stop offset="1" stopColor="#a7adff" stopOpacity="0" /></radialGradient>
      </defs>
      <g className="ai-orb-body">
        <path d="M100 24C137 19 174 55 174 96C181 135 143 174 105 176C61 181 23 147 25 105C19 64 60 25 100 24Z" fill={`url(#${id}-core)`} />
        <g className="ai-orb-ribbons" stroke={`url(#${id}-ribbon)`} strokeWidth="12">
          <ellipse cx="100" cy="100" rx="69" ry="39" transform="rotate(-48 100 100)" />
          <ellipse cx="100" cy="100" rx="69" ry="39" transform="rotate(35 100 100)" />
          <ellipse cx="100" cy="100" rx="38" ry="71" transform="rotate(14 100 100)" />
        </g>
        <g stroke={`url(#${id}-shine)`} strokeWidth="1.5" opacity=".85">
          <path d="M53 47C112 11 173 83 155 145C143 183 65 162 38 120C16 85 79 33 125 31" />
          <path d="M44 135C97 163 159 123 159 74M72 30C37 94 87 176 132 163M34 81C66 42 135 51 166 114" />
        </g>
        <ellipse cx="76" cy="58" rx="41" ry="24" transform="rotate(-35 76 58)" fill={`url(#${id}-light)`} />
      </g>
    </svg>
    <div className="ai-orb-shadow" />
  </div>;
}
