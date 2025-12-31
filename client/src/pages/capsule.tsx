import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lock, Unlock, Clock, ExternalLink, Sparkles, Copy, Check, Share2, Loader2 } from "lucide-react";
import logoImage from "@assets/logo_final_1767063482143.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Footer } from "@/components/Footer"; // WICHTIG: Der neue Import!

interface CapsuleData {
  id: string;
  encryptedContent: string;
  messageHash: string;
  revealDate: string;
  isRevealed: boolean;
  decryptedContent?: string;
  isMinted: boolean;
  transactionHash?: string;
  createdAt: string;
  sealerIdentity?: string;
  sealerType?: string;
  sealerAddress?: string;
}

interface Props {
  id: string;
}

function formatUTC(date: Date): string {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', day: 'numeric', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' 
  };
  return date.toLocaleDateString('en-US', options) + ' UTC';
}

function calculateTimeLeft(targetDate: Date) {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    expired: false,
  };
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) return null;

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-br from-[#1652F0]/50 to-purple-500/50 rounded-xl blur-sm"></div>
        <div className="relative bg-black/80 border border-white/10 rounded-xl px-4 py-3 min-w-[70px] md:min-w-[90px]">
          <span className="text-3xl md:text-5xl font-display font-bold text-white tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="text-xs md:text-sm text-[#CBD5E1] mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-2xl md:text-4xl text-[#1652F0]/50 font-light">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-2xl md:text-4xl text-[#1652F0]/50 font-light">:</span>
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <span className="text-2xl md:text-4xl text-[#1652F0]/50 font-light">:</span>
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </div>
  );
}

function RevealedMessage({ message, sealerIdentity, sealedAt, revealedAt }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative">
      <div className="absolute -inset-2 bg-gradient-to-br from-[#1652F0]/30 via-[#3B82F6]/20 to-[#1652F0]/30 rounded-2xl blur-xl"></div>
      <div className="relative bg-black/60 border border-[#1652F0]/40 rounded-2xl p-8 md:p-12 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1652F0] to-[#3B82F6] flex items-center justify-center shadow-[0_0_15px_rgba(22,82,240,0.5)]">
            <Unlock className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-display font-bold text-[#F8FAFC]">Message Revealed</h3>
        </div>
        <p className="text-sm text-[#CBD5E1] mb-4 italic">
          {sealerIdentity || 'Someone'} wrote on {formatUTC(new Date(sealedAt))} for {formatUTC(new Date(revealedAt))}:
        </p>
        <div className="prose prose-invert max-w-none">
          <p className="text-lg md:text-xl leading-relaxed text-[#F8FAFC]/90 font-light whitespace-pre-wrap">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ZoraMintSection({ capsule, currentUserAddress, onMintSuccess }: any) {
  const { toast } = useToast();
  const isAuthor = currentUserAddress && capsule.sealerAddress && 
                   currentUserAddress.toLowerCase() === capsule.sealerAddress.toLowerCase();

  if (capsule.isMinted) return (
    <div className="pt-6 border-t border-[#1652F0]/30 text-center">
      <Button className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600" asChild>
        <a href={`https://zora.co/collect/base:${capsule.transactionHash}`} target="_blank"><ExternalLink className="mr-2 h-5 w-5" /> View on Zora</a>
      </Button>
    </div>
  );

  return (
    <div className="pt-6 border-t border-[#1652F0]/30">
      {!isAuthor ? (
        <div className="w-full h-14 rounded-xl bg-purple-900/20 border border-purple-500/30 flex items-center justify-center text-[#CBD5E1]/60 italic">
          <Sparkles className="mr-2 h-5 w-5 opacity-50" /> Author-Only Minting
        </div>
      ) : (
        <Button onClick={() => window.open(`https://zora.co/create?name=TimeCapsule`, '_blank')} className="w-full h-14 bg-[#6366F1] hover:bg-[#5558E3] shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Sparkles className="mr-2 h-5 w-5" /> Mint on Zora
        </Button>
      )}
      <p className="text-center text-xs text-[#CBD5E1]/50 mt-3">Only the capsule author can mint this message as an NFT.</p>
    </div>
  );
}

export default function CapsulePage({ id }: Props) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);

  useEffect(() => {
    const storedWallet = localStorage.getItem("wallet_address");
    if (storedWallet) setCurrentUserAddress(storedWallet);
  }, []);

  const { data: capsule, isLoading }: any = useQuery({ 
    queryKey: ['/api/capsules', id], 
    refetchInterval: (q: any) => q.state.data && !q.state.data.isRevealed ? 5000 : false 
  });

  const capsuleUrl = `${window.location.origin}/capsule/${id}`;

  if (isLoading || !capsule) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Loading...</div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1652F0]/10 rounded-full blur-[120px]" />
      </div>

      <main className="w-full max-w-3xl flex-1 flex flex-col">
        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Link href="/">
            <div className="flex flex-col items-center cursor-pointer group">
              <img src={logoImage} className="h-[105px] w-auto mb-[-8px] drop-shadow-[0_0_20px_rgba(22,82,240,0.6)] group-hover:scale-105 transition-transform" />

              <h1 className="text-4xl font-extrabold text-white tracking-tighter glow-text leading-none mb-1">TimeCapsule</h1>

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

        <div className="glass-card rounded-3xl p-6 md:p-10 border border-[#1652F0]/30 shadow-[0_0_30px_rgba(22,82,240,0.15)] bg-black/40">
          {capsule.isRevealed ? (
            <div className="space-y-8">
              <RevealedMessage message={capsule.decryptedContent} sealerIdentity={capsule.sealerIdentity} sealedAt={capsule.createdAt} revealedAt={capsule.revealDate} />
              <ZoraMintSection capsule={capsule} currentUserAddress={currentUserAddress} onMintSuccess={() => {}} />
            </div>
          ) : (
            <div className="space-y-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1652F0]/10 rounded-full ring-2 ring-[#1652F0]/30">
                <Lock className="w-10 h-10 text-[#1652F0]" />
              </div>
              <h2 className="text-3xl font-bold text-white glow-text">Capsule Locked</h2>
              <CountdownTimer targetDate={new Date(capsule.revealDate)} />
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between text-sm font-mono text-[#1652F0]">
                <span className="text-[#CBD5E1]">Reveals at:</span>
                <span>{formatUTC(new Date(capsule.revealDate))}</span>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#1652F0]/30 space-y-4">
             <div className="bg-black/60 p-3 rounded-lg border border-[#1652F0]/20 flex items-center gap-2">
                <a href={capsuleUrl} target="_blank" className="text-sm text-[#1652F0] truncate hover:underline flex-1 font-mono">{capsuleUrl}</a>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(capsuleUrl); setHasCopied(true); setTimeout(() => setHasCopied(false), 2000); }}>
                  {hasCopied ? <Check className="text-green-400 w-4 h-4" /> : <Copy className="w-4 h-4 text-[#CBD5E1]" />}
                </Button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => window.open(`https://warpcast.com/~/compose?text=Check out this TimeCapsule&embeds[]=${capsuleUrl}`)}><Share2 className="mr-2 w-4 h-4" /> Share</Button>
                <Link href="/"><Button className="w-full bg-white text-black">Create New</Button></Link>
             </div>
          </div>
        </div>
      </main>

      {/* Hier ist der neue, einheitliche Footer */}
      <Footer />

    </div>
  );
}