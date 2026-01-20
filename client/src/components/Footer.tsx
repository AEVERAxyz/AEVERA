import { 
  SiFarcaster, 
  SiX, 
  SiGithub, 
  SiMedium, 
  SiOpensea 
} from "react-icons/si";

// Das Base Icon behalten wir als Custom SVG, da es hier als 
// "Status Indikator" (Blue Dot) und nicht als reines Logo dient.
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
          <SiFarcaster size={18} className="group-hover:scale-110 transition-transform" />
        </a>

        {/* X (Twitter - @AEVERAxyz) */}
        <a 
          href="https://x.com/AEVERAxyz" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group"
          title="X (Twitter)"
        >
          <SiX size={18} className="group-hover:scale-110 transition-transform"/>
        </a>

        {/* GitHub (@AEVERAxyz) */}
        <a 
          href="https://github.com/AEVERAxyz" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group"
          title="GitHub Source"
        >
          <SiGithub size={18} className="group-hover:scale-110 transition-transform"/>
        </a>

        {/* OpenSea Collection */}
        <a 
          href="https://opensea.io/collection/aevera" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-[#2081E2] hover:bg-[#2081E2]/10 hover:border-[#2081E2]/30 transition-all duration-300 group"
          title="OpenSea Collection"
        >
          <SiOpensea size={18} className="group-hover:scale-110 transition-transform"/>
        </a>

        {/* Medium (@AEVERAxyz) */}
        <a 
          href="https://medium.com/@AEVERAxyz" 
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 group"
          title="Medium Blog"
        >
          <SiMedium size={18} className="group-hover:scale-110 transition-transform"/>
        </a>

      </div>
    </footer>
  );
}