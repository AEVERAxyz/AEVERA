import { useState } from "react";
import { CreateCapsuleForm } from "@/components/CreateCapsuleForm";
import { SuccessCard } from "@/components/SuccessCard";
import { motion } from "framer-motion";
import { Hourglass } from "lucide-react";

export default function Home() {
  const [createdCapsuleId, setCreatedCapsuleId] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 backdrop-blur-sm border border-white/10 ring-1 ring-white/5 shadow-xl">
            <Hourglass className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/50 tracking-tight glow-text">
            TimeCapsule
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-lg mx-auto leading-relaxed">
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
              {/* Decorative gradient border effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
              
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

      <footer className="mt-16 text-center text-sm text-muted-foreground/60 font-mono">
        <p>Built on Base • Farcaster Frame Compatible • Zora Integration</p>
      </footer>
    </div>
  );
}
