import { useState } from "react";
import { CreateCapsuleForm } from "@/components/CreateCapsuleForm";
import { ArchiveTable } from "@/components/ArchiveTable";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import logoImage from "@assets/logo_final_1767063482143.png";
import { Link } from "wouter";

// NEU: Imports für die Success-Logik direkt hier
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ArrowRight, RotateCcw } from "lucide-react";
import { SiFarcaster } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [createdCapsuleId, setCreatedCapsuleId] = useState<string | null>(null);
  const { toast } = useToast();

  // Funktion zum Kopieren des Links
  const copyLink = () => {
    if (!createdCapsuleId) return;
    const link = `${window.location.origin}/capsule/${createdCapsuleId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Capsule link copied to clipboard",
    });
  };

  // Funktion für Warpcast Share
  const shareOnWarpcast = () => {
    if (!createdCapsuleId) return;
    const link = `${window.location.origin}/capsule/${createdCapsuleId}`;
    const text = "I just sealed a message to the future in a TimeCapsule. ⏳✨\n\nMint it when it reveals!";
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(link)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1652F0]/10 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-2xl relative z-10 flex-1 flex flex-col justify-center mt-8 md:mt-12">
        {/* HEADER (Dein Original-Design) */}
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
            /* HIER IST DIE ÄNDERUNG: Inline Success Screen mit getauschten Buttons */
            <div className="glass-card rounded-3xl p-6 md:p-10 border border-[#1652F0]/30 shadow-[0_0_30px_rgba(22,82,240,0.15)] bg-black/40 text-center animate-in fade-in zoom-in duration-500">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/50 mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>

              <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-display font-bold text-white">Capsule Sealed!</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Your message has been encrypted and stored safely. It will automatically reveal at the scheduled time.
                </p>
              </div>

              {/* Link Box */}
              <div className="space-y-2 text-left mb-8">
                <label className="text-xs font-bold text-blue-400 uppercase tracking-wider ml-1">Capsule Link</label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono truncate">
                    {`${window.location.origin}/capsule/${createdCapsuleId}`}
                  </div>
                  <Button variant="outline" size="icon" onClick={copyLink} className="shrink-0 h-11 w-11 border-white/10 hover:bg-white/5 hover:text-white">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons - UX OPTIMIZED & SWAPPED */}
              <div className="grid gap-4">
                {/* 1. Primary Action: View Capsule (BLAU) */}
                <Link href={`/capsule/${createdCapsuleId}`}>
                  <Button className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-[#1652F0] to-[#3B82F6] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(22,82,240,0.4)] border-0 text-white gap-2">
                     <ArrowRight className="w-5 h-5" /> View Your Capsule
                  </Button>
                </Link>

                <div className="grid grid-cols-2 gap-4">
                  {/* 2. Share Action (Warpcast Text angepasst) */}
                  <Button variant="outline" onClick={shareOnWarpcast} className="h-12 border-[#855DCD]/30 hover:bg-[#855DCD]/10 text-white gap-2 rounded-xl">
                    <SiFarcaster className="w-4 h-4 text-[#855DCD]" /> Share on Warpcast
                  </Button>

                  {/* 3. Secondary Action: Create Another (GRAU / DEZENT) */}
                  <Button 
                    variant="ghost" 
                    onClick={() => setCreatedCapsuleId(null)} 
                    className="h-12 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white gap-2 rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4" /> Create Another
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      <ArchiveTable />

      <Footer />
    </div>
  );
}