export function BottleLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 60 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cork */}
      <rect x="22" y="4" width="16" height="8" rx="2" stroke="#1652F0" strokeWidth="2" fill="none"/>
      
      {/* Bottle neck */}
      <path
        d="M24 12 L24 18 L22 20 L22 22 L38 22 L38 20 L36 18 L36 12"
        stroke="#1652F0"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      
      {/* Bottle body */}
      <path
        d="M22 22 L18 28 L18 58 Q18 62 22 62 L38 62 Q42 62 42 58 L42 28 L38 22"
        stroke="#1652F0"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      
      {/* Scroll inside bottle */}
      <g stroke="#E0E0E0" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M25 35 L35 50" />
        <path d="M25 35 Q23 33 25 31 Q28 30 27 33" />
        <path d="M35 50 Q37 52 35 54 Q32 55 33 52" />
        <line x1="28" y1="40" x2="32" y2="44" />
        <path d="M29 41 Q26 43 28 46" />
        <path d="M31 43 Q34 45 32 48" />
      </g>
      
      {/* Waves below bottle */}
      <g stroke="#1652F0" strokeWidth="2" fill="none" strokeLinecap="round">
        <path d="M8 68 Q15 64 22 68 Q30 72 38 68 Q45 64 52 68" />
        <path d="M5 74 Q12 70 20 74 Q30 78 40 74 Q48 70 55 74" />
      </g>
    </svg>
  );
}
