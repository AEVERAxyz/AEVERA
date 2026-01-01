import { useState } from "react";
import { CreateCapsuleForm } from "@/components/CreateCapsuleForm";
import { ArchiveTable } from "@/components/ArchiveTable";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header"; // Importiert den neuen Header
import { motion } from "framer-motion";

// ONCHAINKIT & UI IMPORTS
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity } from '@coinbase/onchainkit/identity';
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, ArrowRight, RotateCcw } from "lucide-react";
import { SiFarcaster } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

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
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] relative overflow-x-hidden">

      {/* WALLET INTEGRATION */}
      <div className="w-full max-w-5xl flex justify-end mb-4 z-50">
        <div className="onchainkit-custom">
          <Wallet>
            <ConnectWallet className="bg-[#1652F0] hover:bg-[#0039CB] text-white rounded-xl px-4 py-2 flex items-center gap-2 border-none">
              <Avatar className="h-6 w-6" />
              <Name className="text-white" />
            </ConnectWallet>
            <WalletDropdown className="bg-[#020617] border border-white/10 shadow-2xl">
              <Identity className="px-4 pt-3 pb-2 bg-[#020617] hover:bg-white/5" hasCopyAddressOnClick>
                <Avatar />
                <Name className="text-white" />
                <Address className="text-blue-400" />
              </Identity>
              <WalletDropdownDisconnect className="hover:bg-red-500/10 text-red-500 font-bold bg-[#020617]" />
            </WalletDropdown>
          </Wallet>
        </div>
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1652F0]/10 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-2xl relative z-10 flex flex-col justify-center mt-12">
        {/* DER NEUE SYNCHRONISIERTE HEADER */}
        <Header />

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
              <div className="grid gap-4">
                <Link href={`/capsule/${createdCapsuleId}`}>
                  <Button className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-[#1652F0] to-[#3B82F6] hover:opacity-90 transition-all shadow-[0_0_20px_rgba(22,82,240,0.4)] border-0 text-white gap-2">
                     <ArrowRight className="w-5 h-5" /> View Your Capsule
                  </Button>
                </Link>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" onClick={shareOnWarpcast} className="h-12 border-[#855DCD]/30 hover:bg-[#855DCD]/10 text-white gap-2 rounded-xl">
                    <SiFarcaster className="w-4 h-4 text-[#855DCD]" /> Share on Warpcast
                  </Button>
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

      <div className="w-full mt-12">
        <ArchiveTable />
      </div>

      <Footer />
    </div>
  );
}