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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/15 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src={logoImage} 
              alt="TimeCapsule Logo" 
              className="h-[60px] w-auto"
              style={{ filter: "drop-shadow(0 0 10px #1652F0)" }}
              data-testid="img-logo"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-br from-[#E0E0E0] via-[#C0C0C0] to-[#808080] tracking-tight glow-text">
            TimeCapsule
          </h1>
          <p className="text-xl md:text-2xl text-soft-muted font-light max-w-lg mx-auto leading-relaxed">
            Send a message to the future. <br/>
            <span className="text-primary/80">Mint it as an NFT when revealed.</span>
          </p>
        </motion.div>

        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative"
        >
          {!createdCapsuleId ? (
            <div className="glass-card rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden neon-container">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30"></div>
              
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
