import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreateCapsuleForm } from "@/components/CreateCapsuleForm";
import { SuccessCard } from "@/components/SuccessCard";
import { ArchiveTable } from "@/components/ArchiveTable";
import { motion } from "framer-motion";
import logoImage from "@assets/logo_final_1767063482143.png";

export default function Home() {
  const [createdCapsuleId, setCreatedCapsuleId] = useState<string | null>(null);
  
  const { data: stats } = useQuery<{ totalCapsules: number }>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 relative">
      <main className="w-full max-w-2xl relative z-10 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="flex flex-col items-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center mb-[10px]">
              <img 
                src={logoImage} 
                alt="TimeCapsule Logo" 
                className="h-[120px] w-auto breathing-animation"
                style={{ filter: "drop-shadow(0 0 20px rgba(22, 82, 240, 0.6))" }}
                data-testid="img-logo"
              />
            </div>
            <h1 
              className="text-3xl md:text-4xl font-sans font-extrabold mb-3 text-[#F8FAFC] glow-text"
              style={{ letterSpacing: "-0.04em" }}
            >
              TimeCapsule
            </h1>
            <p className="text-sm text-[#CBD5E1] font-light mb-1">
              Send a message to the future.
            </p>
            <p 
              className="text-xs font-light"
              style={{ color: "rgba(22, 82, 240, 0.7)" }}
            >
              Mint it as an NFT when revealed.
            </p>
          </div>
        </motion.div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          {!createdCapsuleId ? (
            <div className="glass-card rounded-3xl p-6 md:p-10 relative overflow-visible">
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

      <footer className="mt-16 text-center space-y-4 pb-8">
        {stats && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-lg font-display font-bold text-primary/80"
            data-testid="text-global-counter"
          >
            {stats.totalCapsules.toLocaleString()} messages sent to the future
          </motion.p>
        )}
        <p className="text-xs text-soft-muted/50 font-mono tracking-wide">
          Built on Base • Farcaster Frame Compatible • Zora Integration
        </p>
        <p className="text-xs text-soft-muted/40 italic tracking-widest">
          created by gelassen.eth
        </p>
      </footer>
    </div>
  );
}
