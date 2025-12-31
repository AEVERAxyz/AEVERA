import { useState } from "react";
import { CreateCapsuleForm } from "@/components/CreateCapsuleForm";
import { SuccessCard } from "@/components/SuccessCard";
import { ArchiveTable } from "@/components/ArchiveTable";
import { Footer } from "@/components/Footer"; // WICHTIG: Hier importieren wir die neue Datei
import { motion } from "framer-motion";
import logoImage from "@assets/logo_final_1767063482143.png";
import { Link } from "wouter";

export default function Home() {
  const [createdCapsuleId, setCreatedCapsuleId] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1652F0]/10 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-2xl relative z-10 flex-1 flex flex-col justify-center mt-8 md:mt-12">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <Link href="/">
            <div className="flex flex-col items-center cursor-pointer group">
              <img 
                src={logoImage} 
                alt="TimeCapsule Logo" 
                className="h-[105px] w-auto mb-[-8px] drop-shadow-[0_0_20px_rgba(22, 82, 240, 0.6)] group-hover:scale-105 transition-transform duration-300" 
              />

              <h1 className="text-4xl font-extrabold text-white tracking-tighter glow-text leading-none mb-1">
                TimeCapsule
              </h1>

              <div className="w-[218px] border-t border-[#1652F0]/30 pt-2 flex flex-col items-center">
                <p className="text-[12px] text-[#CBD5E1] uppercase font-medium whitespace-nowrap text-center"
                   style={{ letterSpacing: '0.076em', marginRight: '-0.076em' }}>
                  Send a message to the future
                </p>
                <p className="text-[10px] text-[#1652F0] uppercase font-extrabold whitespace-nowrap text-center mt-1.5"
                   style={{ letterSpacing: '0.14em', marginRight: '-0.14em' }}>
                  Mint it as an NFT when revealed
                </p>
              </div>
            </div>
          </Link>
        </motion.div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          {!createdCapsuleId ? (
            <div className="glass-card rounded-3xl p-6 md:p-10 border border-[#1652F0]/30 shadow-[0_0_30px_rgba(22,82,240,0.15)] bg-black/40 relative overflow-visible">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#1652F0]/50 to-transparent opacity-50"></div>
              <CreateCapsuleForm onSuccess={setCreatedCapsuleId} />
            </div>
          ) : (
            <SuccessCard 
              capsuleId={createdCapsuleId} 
              onReset={() => setCreatedCapsuleId(null)} 
            />
          )}
        </motion.div>
      </main>

      <ArchiveTable />

      {/* Hier wird der neue Footer angezeigt */}
      <Footer />

    </div>
  );
}