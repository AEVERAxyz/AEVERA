import React from 'react';

// Update V8.4: Finale Korrektur des Datums-Parsings (Jahr wird jetzt korrekt erkannt) & Uniform Style.

interface SimulatorProps {
  mode: 'public' | 'private';
  date: string;       // "Jan 11, 2026, 23:07 UTC"
  revealDate: string; // "Jan 11, 2026, 23:12 UTC"
  author: string;
  uuid: string;
  shortId: string;
}

export const OnChainSimulator: React.FC<SimulatorProps> = ({ mode, date, revealDate, author, shortId }) => {

  // Design Constants
  const colors = {
    bg: "#020617",
    publicGradientStart: "#22d3ee", 
    publicGradientEnd: "#2563eb",   
    privateGradientStart: "#c084fc", 
    privateGradientEnd: "#db2777",   
    textMain: "#ffffff",
    textDim: "#94a3b8", 
    accentPublic: "#22d3ee",
    accentPrivate: "#e879f9",
    border: "#1e293b"
  };

  const isPublic = mode === 'public';
  const accentColor = isPublic ? colors.accentPublic : colors.accentPrivate;
  const gradId = isPublic ? "gradPublic" : "gradPrivate";

  const displayAuthor = author.length > 22 ? author.substring(0, 20) + "..." : author;

  const footerExplainText = isPublic 
    ? "Open to the world after Reveal Era." 
    : "Restricted to NFT holder & Key.";
  const footerTypeText = isPublic ? "PUBLIC BROADCAST" : "PRIVATE VAULT";

  // --- LOGIC FIX: ROBUSTES PARSING V2 ---

  const parseDateTime = (str: string) => {
      if (!str) return { date: "...", time: "..." };

      // 1. Contract Format (" . ") -> Das ist einfach
      if (str.includes(" . ")) {
          const parts = str.split(" . ");
          return { date: parts[0], time: parts[1] };
      }

      // 2. Frontend Format mit Kommas ("Jan 11, 2026, 23:07 UTC")
      // Wir suchen das LETZTE Komma. Alles davor ist das Datum (inkl. Jahr), alles danach die Zeit.
      const lastComma = str.lastIndexOf(",");

      if (lastComma !== -1) {
          const datePart = str.substring(0, lastComma).trim(); // "Jan 11, 2026"
          const timePart = str.substring(lastComma + 1).trim(); // "23:07 UTC"
          return { date: datePart, time: timePart };
      }

      // Fallback
      return { date: str, time: "" };
  };

  const sealData = parseDateTime(date);
  const revealData = parseDateTime(revealDate);

  // Vergleich: Ist das Datum (Tag/Monat/Jahr) exakt gleich?
  const isSameDay = sealData.date === revealData.date;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 border border-gray-700 rounded-xl w-full max-w-[650px] mx-auto">
      <div className="flex justify-between w-full items-center">
          <h3 className="text-white font-mono text-xs uppercase tracking-widest text-opacity-50">On-Chain Asset Preview</h3>
          <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">● Live Render</span>
      </div>

      <svg width="600" height="600" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{maxWidth: '100%', height: 'auto', border: '1px solid #333', boxShadow: '0 0 40px rgba(0,0,0,0.5)'}}>

        <defs>
          <linearGradient id="gradPublic" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.publicGradientStart} />
            <stop offset="100%" stopColor={colors.publicGradientEnd} />
          </linearGradient>
          <linearGradient id="gradPrivate" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.privateGradientStart} />
            <stop offset="100%" stopColor={colors.privateGradientEnd} />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

           <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect width="600" height="600" fill={colors.bg} />
        <rect width="600" height="6" fill={`url(#${gradId})`} />

        <g transform="translate(32, 35)"> 
           <text x="100" y="30" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="48" fill="white" filter="url(#glow)" letterSpacing="1">AEVERA</text>
           <text x="100" y="52" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fill="#CBD5E1" letterSpacing="8" fontWeight="bold">BEYOND TIME</text>
           <text x="100" y="68" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill="#60A5FA" letterSpacing="3" fontWeight="bold">THE EVERLASTING TRUTH</text>
        </g>

        <line x1="0" y1="120" x2="600" y2="120" stroke="white" stroke-opacity="0.15" />

        <g transform="translate(32, 140)">
            <text x="12" y="18" fontFamily="monospace" fontSize="8" fill={colors.textDim} letterSpacing="1" style={{textTransform:'uppercase'}}>Origin Identity</text>
            <text x="12" y="35" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="white">{displayAuthor}</text>
        </g>
        <g transform="translate(308, 140)">
            <text x="12" y="18" fontFamily="monospace" fontSize="8" fill={colors.textDim} letterSpacing="1" style={{textTransform:'uppercase'}}>Capsule ID</text>
            <text x="12" y="35" fontFamily="monospace" fontSize="14" fontWeight="bold" fill={colors.textDim} letterSpacing="1">#{shortId}</text>
        </g>

        <g transform="translate(32, 200)">
            <text x="12" y="18" fontFamily="monospace" fontSize="8" fill={colors.textDim} letterSpacing="1" style={{textTransform:'uppercase'}}>Moment of Origin</text>
            <text x="12" y="35" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#3B82F6">{date}</text>
        </g>
        <g transform="translate(308, 200)">
            <text x="12" y="18" fontFamily="monospace" fontSize="8" fill={colors.textDim} letterSpacing="1" style={{textTransform:'uppercase'}}>The Era of Reveal</text>
            <text x="12" y="35" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="#34d399">{revealDate}</text>
        </g>

        <line x1="0" y1="270" x2="600" y2="270" stroke="white" stroke-opacity="0.15" />

        {/* --- NARRATIVE SENTENCE (CORRECT PARSING & UNIFORM STYLE) --- */}
        <g transform="translate(300, 310)" textAnchor="middle">
             <text y="0" fontFamily="serif" fontSize="13" fontStyle="italic" fill="white" letterSpacing="0.5">
                 {isSameDay ? (
                     `Sent beyond time by ${displayAuthor} on ${sealData.date}, arriving later at ${revealData.time}.`
                 ) : (
                     `Sent beyond time by ${displayAuthor} on ${sealData.date}, arriving on ${revealData.date}.`
                 )}
             </text>
        </g>

        <g transform="translate(300, 410)" textAnchor="middle">
            <rect x="-215" y="-65" width="430" height="130" fill="none" stroke={accentColor} strokeOpacity="0.2" rx="0" />
            <text y="-40" fontFamily="monospace" fontSize="10" letterSpacing="3" fill="white" filter="url(#glow)">THE ETERNAL GATEWAY</text>
            <text y="10" fontFamily="sans-serif" fontSize="48" fontWeight="bold" fill="white" letterSpacing="-1" filter="url(#strongGlow)">
                aevera.xyz
            </text>
            <text y="47" fontFamily="monospace" fontSize="16" fill={accentColor} letterSpacing="2" fontWeight="bold">
                /{shortId}
            </text>
        </g>

        <line x1="0" y1="510" x2="600" y2="510" stroke="white" stroke-opacity="0.15" />

        <g transform="translate(32, 540)">
             <text x="0" y="0" fontFamily="monospace" fontSize="10" fill={colors.textDim} letterSpacing="2">• VERIFIED</text>
             <text x="0" y="16" fontFamily="monospace" fontSize="10" fill={colors.textDim} letterSpacing="2">• ETERNAL</text>
             <text x="0" y="32" fontFamily="monospace" fontSize="10" fill={colors.textDim} letterSpacing="2">• AEVERA</text>
        </g>

        <g transform="translate(568, 555)" textAnchor="end">
             <text x="0" y="-5" fontFamily="monospace" fontSize="10" fill={accentColor} letterSpacing="1" fontWeight="bold" style={{textTransform:'uppercase'}}>
                 TYPE: {footerTypeText}
             </text>
             <text x="0" y="12" fontFamily="sans-serif" fontSize="9" fill={colors.textDim}>
                 {footerExplainText}
             </text>
        </g>

      </svg>
    </div>
  );
};