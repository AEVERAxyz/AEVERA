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
          <img
            src={logoImage}
            alt="TimeCapsule Logo"
            className="h-[105px] w-auto mb-[-8px] drop-shadow-[0_0_20px_rgba(22,82,240,0.6)] group-hover:scale-105 transition-transform duration-300"
          />
          <h1 className="text-4xl font-extrabold text-white tracking-tighter glow-text leading-none mb-1">
            TimeCapsule
          </h1>
          <div className="w-[218px] border-t border-[#1652F0]/30 pt-2 flex flex-col items-center">
            <p className="text-[12px] text-[#CBD5E1] uppercase font-medium whitespace-nowrap text-center"
               style={{ letterSpacing: '0.076em', marginRight: '-0.076em' }}>
              Send a message to the future
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}