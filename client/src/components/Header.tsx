import { Link } from "wouter";
import { motion } from "framer-motion";
import logoImage from "@assets/logo_final_1767063482143.png";

export function Header() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="text-center mb-12 flex flex-col items-center"
    >
      <Link href="/">
        <div className="flex flex-col items-center cursor-pointer group">

          {/* 1. Das Logo - Wieder das Originalbild */}
          <img
            src={logoImage}
            alt="AEVERA Logo"
            className="h-[140px] w-auto mb-[-12px] drop-shadow-[0_0_20px_rgba(22,82,240,0.6)] group-hover:scale-105 transition-transform duration-300"
          />

          {/* 2. Das AEVERA Branding */}
          <div className="flex flex-col items-center mt-0">

            {/* ZEILE 1: Der Name */}
            <h1 className="text-6xl md:text-7xl font-black text-white tracking-tighter glow-text leading-none mb-1">
              AEVERA
            </h1>

            {/* ZEILE 2: BEYOND TIME */}
            {/* FIX: 'w-full' durch 'w-fit' und 'px-4' ersetzt. 
                Die Linien sind jetzt nur so breit wie der Textblock. */}
            <div className="w-fit border-t border-b border-[#1652F0]/30 py-1 mb-1 flex justify-center px-4">
              <span 
                className="text-[#CBD5E1] font-bold text-sm tracking-[0.8em] uppercase whitespace-nowrap"
                style={{ marginRight: '-0.8em' }}
              >
                BEYOND TIME
              </span>
            </div>

            {/* ZEILE 3: THE EVERLASTING TRUTH */}
            <p 
              className="text-[0.65rem] text-blue-400 font-medium tracking-[0.32em] uppercase whitespace-nowrap"
              style={{ marginRight: '-0.32em' }}
            >
              THE EVERLASTING TRUTH
            </p>

            {/* ZEILE 4: DER SLOGAN (Weiß & Glänzend) */}
            <p className="mt-6 text-sm md:text-base text-white font-medium italic tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] opacity-90">
              "In a world of vanishing moments, AEVERA is your anchor in time."
            </p>

          </div>
        </div>
      </Link>
    </motion.div>
  );
}