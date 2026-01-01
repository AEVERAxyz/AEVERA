import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export function Footer() {
  const { data: stats } = useQuery<{ totalCapsules: number }>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  return (
    <footer className="w-full mt-4 pb-12 flex flex-col items-center justify-center relative z-10">

      {/* 1. Die Statistik */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <span className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_15px_rgba(22,82,240,0.5)]">
            {stats.totalCapsules.toLocaleString()}
          </span>
          <span className="block text-sm text-[#CBD5E1] mt-1 font-medium tracking-wide">
            messages sealed in time
          </span>
        </motion.div>
      )}

      {/* 2. Tech Stack Pille - FIXED: Horizontal alignment */}
      <div className="flex flex-row items-center gap-4 md:gap-6 text-xs md:text-sm font-medium text-[#CBD5E1]/60 bg-white/5 px-6 py-3 rounded-full border border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
        <span className="text-[#CBD5E1]/40 uppercase tracking-wider text-[10px] mr-1">
          Powered by
        </span>

        {/* Base */}
        <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help" title="Base Network">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0052FF] shadow-[0_0_8px_#0052FF]"></span>
          <span className="whitespace-nowrap">Base</span>
        </div>

        <span className="text-white/10">•</span>

        {/* Farcaster */}
        <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help" title="Farcaster Protocol">
          <span className="w-2.5 h-2.5 rounded bg-[#855DCD] shadow-[0_0_8px_#855DCD]"></span>
          <span className="whitespace-nowrap">Farcaster</span>
        </div>

        <span className="text-white/10">•</span>

        {/* Zora */}
        <div className="flex items-center gap-2 hover:text-white transition-colors cursor-help" title="Zora Integration">
          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-white to-gray-400 shadow-[0_0_8px_rgba(255,255,255,0.5)]"></span>
          <span className="whitespace-nowrap">Zora</span>
        </div>
      </div>

      {/* 3. Signature */}
      <div className="mt-8">
        <p className="text-xs text-[#CBD5E1]/80 italic hover:text-white transition-colors cursor-default tracking-wider">
          created by gelassen.eth
        </p>
      </div>
    </footer>
  );
}