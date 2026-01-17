import { Github } from "lucide-react";

// 1. Offizielles Farcaster Icon (Aus Popup/Home übernommen - Blockig & Fett)
const FarcasterIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V19C20 19.5523 19.5523 20 19 20H15C14.4477 20 14 19.5523 14 19V13H10V19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V6Z" />
  </svg>
);

// 2. Offizielles X (Twitter) Icon
const XIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231h0.001Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
  </svg>
);

// 3. Offizielles Medium Icon
const MediumIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M13.5 10.5C13.5 13.8137 10.8137 16.5 7.5 16.5C4.18629 16.5 1.5 13.8137 1.5 10.5C1.5 7.18629 4.18629 4.5 7.5 4.5C10.8137 4.5 13.5 7.18629 13.5 10.5Z" />
    <path d="M19.5 10.5C19.5 13.5376 18.8284 16 18 16C17.1716 16 16.5 13.5376 16.5 10.5C16.5 7.46243 17.1716 5 18 5C18.8284 5 19.5 7.46243 19.5 10.5Z" />
    <path d="M22.5 10.5C22.5 12.9853 22.1642 15 21.75 15C21.3358 15 21 12.9853 21 10.5C21 8.01472 21.3358 6 21.75 6C22.1642 6 22.5 8.01472 22.5 10.5Z" />
  </svg>
);

// 4. Offizielles Base Icon ("The Basemark")
// Ein solides, abgerundetes Quadrat.
const BaseIcon = ({ className = "" }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <rect width="24" height="24" rx="5" ry="5" />
    </svg>
);

export function Footer() {
  return (
    <footer className="w-full py-8 mt-16 flex flex-col items-center justify-center gap-6 text-center z-10 relative animate-in fade-in slide-in-from-bottom-4 duration-1000 font-sans border-t border-white/5 pt-8">

      {/* Main "Secured By" Box */}
      <div className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-3 shadow-lg relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-default">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="flex items-center gap-2 relative z-10">
            {/* Base Basemark in Official Blue */}
            <BaseIcon className="w-4 h-4 text-[#0052FF]" />
            <span className="text-xs font-semibold text-slate-300 tracking-wide">
              Secured on Base <span className="mx-2 text-slate-600">|</span> Built by <span className="text-white">gelassen.eth</span>
            </span>
        </div>
      </div>

      {/* Social Links Row */}
      <div className="flex items-center gap-4">

        {/* Farcaster (@aevera) */}
        <a 
          href="https://warpcast.com/aevera" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-[#855DCD] hover:bg-[#855DCD]/10 hover:border-[#855DCD]/30 transition-all duration-300 group"
          title="Farcaster"
        >
          <FarcasterIcon size={18} className="group-hover:scale-110 transition-transform" />
        </a>

        {/* X (Twitter - @AEVERAxyz) */}
        <a 
          href="https://x.com/AEVERAxyz" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group"
          title="X (Twitter)"
        >
          <XIcon size={18} className="group-hover:scale-110 transition-transform"/>
        </a>

        {/* GitHub (@AEVERAxyz) */}
        <a 
          href="https://github.com/AEVERAxyz" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group"
          title="GitHub Source"
        >
          <Github size={18} className="group-hover:scale-110 transition-transform"/>
        </a>

        {/* Medium (@AEVERAxyz) */}
        <a 
          href="https://medium.com/@AEVERAxyz" 
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group"
          title="Medium Blog"
        >
          <MediumIcon size={18} className="group-hover:scale-110 transition-transform"/>
        </a>

      </div>
    </footer>
  );
}