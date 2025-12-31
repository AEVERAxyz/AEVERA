import { useState } from "react";
import { CreateCapsuleForm } from "@/components/CreateCapsuleForm";
import { ArchiveTable } from "@/components/ArchiveTable"; 
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ArrowRight, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { SiFarcaster } from "react-icons/si";
import { motion } from "framer-motion";

export default function Home() {
  const [createdCapsuleId, setCreatedCapsuleId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyLink = () => {
    if (!createdCapsuleId) return;
    const link = `${window.location.origin}/capsule/${createdCapsuleId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Capsule link copied to clipboard",
    });
  };

  const shareOnWarpcast = () => {
    if (!createdCapsuleId) return;
    const link = `${window.location.origin}/capsule/${createdCapsuleId}`;
    const text = "I just sealed a message to the future in a TimeCapsule. ⏳✨\n\nMint it when it reveals!";
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(link)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30">

      {/* Header / Hero Section */}
      <div className="relative pt-12 pb-6 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center gap-4 mb-2">
          {/* Logo Animation */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-2"
          >
            <img src="/logo.png" alt="TimeCapsule Logo" className="w-16 h-16 opacity-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          </motion.div>

          <h1 className="text-5xl md:text-6xl font-display font-bold tracking-tight text-white glow-text">
            TimeCapsule
          </h1>
          <p className="text-blue-200/80 uppercase tracking-[0.2em] text-sm font-medium">
            Send a message to the future
          </p>
          <p className="text-[#3B82F6] uppercase tracking-[0.1em] text-xs font-bold animate-pulse">
            Mint it as an NFT when revealed
          </p>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 pb-24 space-y-16 relative z-10">

        {/* Main Content Area */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl ring-1 ring-white/5">

          {!createdCapsuleId ? (
            <CreateCapsuleForm onSuccess={setCreatedCapsuleId} />
          ) : (
            <div className="text-center py-8 space-y-8 animate-in fade-in zoom-in duration-500">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center ring-1 ring-green-500/50 mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-display font-bold text-white">Capsule Sealed!</h2>
                <p className="text-slate-400 max-w-md mx-auto">
                  Your message has been encrypted and stored safely. It will automatically reveal at the scheduled time.
                </p>
              </div>

              {/* Link Box */}
              <div className="space-y-2 text-left">
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

              {/* Action Buttons */}
              <div className="grid gap-4">
                {/* 1. Primary Action: View Capsule */}
                <Link href={`/capsule/${createdCapsuleId}`}>
                  <Button className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-[#1652F0] to-[#3B82F6] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(22,82,240,0.4)] border-0 text-white gap-2">
                     <ArrowRight className="w-5 h-5" /> View Your Capsule
                  </Button>
                </Link>

                <div className="grid grid-cols-2 gap-4">
                  {/* 2. Share Action */}
                  <Button variant="outline" onClick={shareOnWarpcast} className="h-12 border-[#855DCD]/30 hover:bg-[#855DCD]/10 text-white gap-2 rounded-xl">
                    <SiFarcaster className="w-4 h-4 text-[#855DCD]" /> Share on Warpcast
                  </Button>

                  {/* 3. Secondary Action: Create Another */}
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
        </div>

        {/* Transparency Archive - Corrected Component Name */}
        <ArchiveTable />

        {/* Footer */}
        <footer className="text-center space-y-6 pt-8 pb-8 border-t border-white/5">
          <div className="flex justify-center items-center gap-8 text-xs font-medium tracking-widest text-slate-500 uppercase">
             <div className="flex flex-col gap-1">
               <span className="text-white text-lg font-bold font-display">
                 1
               </span>
               <span>messages sealed in time</span>
             </div>
          </div>

          <div className="flex justify-center items-center gap-6 text-[10px] tracking-widest text-slate-600 uppercase font-medium">
            <span>Powered by</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-[#0052FF]"></span> Base</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-[#855DCD]"></span> Farcaster</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-white"></span> Zora</span>
          </div>

          <div className="text-slate-600 text-xs hover:text-blue-400 transition-colors cursor-default">
            created by gelassen.eth
          </div>
        </footer>

      </div>
    </div>
  );
}