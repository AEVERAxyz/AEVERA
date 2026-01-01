import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lock, ExternalLink, Sparkles, Copy, Check, Loader2, Camera } from "lucide-react";
import { SiFarcaster } from "react-icons/si";
import logoImage from "@assets/logo_final_1767063482143.png";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Footer } from "@/components/Footer";
import { ArchiveTable } from "@/components/ArchiveTable";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";

// WALLET IMPORTS (Optimiert für Version 0.31.1)
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity } from '@coinbase/onchainkit/identity';

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

// HILFSFUNKTION FÜR ECHTE UTC-ANZEIGE
function formatToStrictUTC(dateString: string): string {
  const d = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  };
  return d.toLocaleDateString('en-US', options) + ' UTC';
}

function formatSimpleDateUTC(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
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
  };
}

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft && 'expired' in timeLeft && timeLeft.expired) return null;

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
      <TimeBlock value={timeLeft.days || 0} label="Days" />
      <span className="text-2xl md:text-4xl text-[#1652F0]/50 font-light">:</span>
      <TimeBlock value={timeLeft.hours || 0} label="Hours" />
      <span className="text-2xl md:text-4xl text-[#1652F0]/50 font-light">:</span>
      <TimeBlock value={timeLeft.minutes || 0} label="Mins" />
      <span className="text-2xl md:text-4xl text-[#1652F0]/50 font-light">:</span>
      <TimeBlock value={timeLeft.seconds || 0} label="Secs" />
    </div>
  );
}

function RevealedMessage({ message, sealerIdentity, sealedAt, revealedAt, capsuleId, cardRef }: any) {
  const capsuleUrl = `${window.location.origin}/capsule/${capsuleId}`;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative max-w-xl mx-auto" ref={cardRef}>
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-purple-600/30 rounded-2xl blur-xl"></div>
      <div className="relative bg-[#020617]/95 border border-[#1652F0]/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"></div>

        <div className="px-6 py-3 relative flex-1 flex flex-col">
          <div className="flex items-center justify-start gap-3 mb-2 border-b border-white/10 pb-2 mt-1">
             <div className="flex-shrink-0">
               <img src={logoImage} alt="TC" className="w-16 h-auto drop-shadow-[0_0_20px_rgba(22,82,240,0.5)]" />
             </div>
             <div className="flex flex-col items-center justify-center">
                <span className="title-fix font-display font-bold text-white text-3xl tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] leading-none">TimeCapsule</span>
                <span className="subtitle-fix text-[10px] text-[#3B82F6] uppercase tracking-[0.22em] font-bold shadow-blue-500/20 drop-shadow-sm mt-1 whitespace-nowrap">A Message to the Future</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 text-xs font-mono">
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                  <span className="block text-slate-500 uppercase text-[9px] mb-0.5 tracking-widest">Origin Identity</span>
                  <div className="meta-text-fix text-white font-bold text-xs truncate h-7 flex items-center">{sealerIdentity || 'Anonymous'}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                  <span className="block text-slate-500 uppercase text-[9px] mb-0.5 tracking-widest">Capsule ID</span>
                  <div className="meta-text-fix text-cyan-400 font-mono text-[9px] truncate h-7 flex items-center drop-shadow-[0_0_3px_rgba(34,211,238,0.3)]">{capsuleId}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="block text-slate-500 uppercase text-[9px] mb-0.5 tracking-widest">Sealed At</span>
                  <div className="meta-text-fix text-slate-200 shadow-white/10 drop-shadow-sm text-[10px] h-7 flex items-center">{formatToStrictUTC(sealedAt)}</div>
              </div>
              <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                  <span className="block text-slate-500 uppercase text-[9px] mb-0.5 tracking-widest">Revealed At</span>
                  <div className="meta-text-fix text-emerald-400 shadow-emerald-400/20 drop-shadow-sm text-[10px] h-7 flex items-center">{formatToStrictUTC(revealedAt)}</div>
              </div>
          </div>

          <div className="relative bg-gradient-to-b from-black/60 to-black/40 p-5 rounded-xl border border-white/10 mb-2 h-[280px] overflow-y-auto flex flex-col">
              <div className="intro-text-fix text-[10px] text-slate-300 font-mono mb-6 text-left w-full leading-relaxed border-b border-white/5 pb-2">
                {sealerIdentity || 'Anonymous'} wrote this message on {formatSimpleDateUTC(sealedAt)} to the future on {formatSimpleDateUTC(revealedAt)}.
              </div>

              <div className="flex-1 flex items-center justify-center relative px-4">
                 <span className="absolute -top-2 -left-1 text-5xl text-cyan-500/30 font-serif drop-shadow-[0_0_10px_rgba(6,182,212,0.2)]">"</span>
                 <p className="relative z-10 text-xl leading-relaxed text-white font-serif font-light whitespace-pre-wrap text-center">{message}</p>
                 <span className="absolute -bottom-4 -right-1 text-5xl text-purple-500/30 font-serif rotate-180 drop-shadow-[0_0_10px_rgba(168,85,247,0.2)]">"</span>
              </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-auto mb-1">
              <div className="text-[9px] text-slate-300 uppercase tracking-widest space-y-1 font-medium">
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></div><p className="footer-text-fix">Immutable Record</p></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-[0_0_5px_rgba(168,85,247,0.8)]"></div><p className="footer-text-fix">Secured on Base</p></div>
                  <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]"></div><p className="footer-text-fix">Verifiable Content</p></div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="scan-text-fix text-[8px] text-slate-500 uppercase tracking-widest whitespace-nowrap">Scan to Verify</span>
                 <div className="p-1 rounded-lg border border-white/10 bg-black/40 shadow-lg">
                     <div style={{ height: "auto", margin: "0 auto", maxWidth: 48, width: "100%" }}>
                         <QRCode size={256} style={{ height: "auto", maxWidth: "100%", width: "100%" }} value={capsuleUrl} viewBox={`0 0 256 256`} bgColor="transparent" fgColor="#FFFFFF" />
                     </div>
                 </div>
              </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CapsulePage({ id }: { id: string }) {
  const [hasCopied, setHasCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null); 
  const { toast } = useToast();

  const { data: capsule, isLoading }: any = useQuery({ 
    queryKey: ['/api/capsules', id], 
    refetchInterval: (q: any) => q.state.data && !q.state.data.isRevealed ? 5000 : false 
  });

  const capsuleUrl = `${window.location.origin}/capsule/${id}`;

  if (isLoading || !capsule) return <div className="min-h-screen flex items-center justify-center bg-[#050A15] text-blue-400"><Loader2 className="animate-spin w-10 h-10" /></div>;

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
        const canvas = await html2canvas(cardRef.current, {
            backgroundColor: "#020617",
            scale: 2,
            useCORS: true,
            onclone: (clonedDoc) => {
                const title = clonedDoc.querySelector('.title-fix') as HTMLElement;
                if (title) { title.style.filter = 'none'; title.style.textShadow = '0 0 15px rgba(255,255,255,0.5)'; title.style.marginTop = '-10px'; }
                const subtitle = clonedDoc.querySelector('.subtitle-fix') as HTMLElement;
                if (subtitle) { subtitle.style.filter = 'none'; subtitle.style.textShadow = '0 0 2px rgba(59, 130, 246, 0.5)'; subtitle.style.marginTop = '5px'; }
                const intro = clonedDoc.querySelector('.intro-text-fix') as HTMLElement;
                if(intro) intro.style.marginTop = '-12px'; 
                const metas = clonedDoc.querySelectorAll('.meta-text-fix');
                metas.forEach((el) => (el as HTMLElement).style.marginTop = '-10px'); 
                const footerTexts = clonedDoc.querySelectorAll('.footer-text-fix');
                footerTexts.forEach((el) => { (el as HTMLElement).style.marginTop = '-9px'; });
                const scanText = clonedDoc.querySelector('.scan-text-fix') as HTMLElement;
                if (scanText) { scanText.style.marginTop = '-9px'; scanText.style.display = 'block'; }
            }
        });
        const link = document.createElement('a');
        link.download = `timecapsule-${capsule.id.slice(0,8)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (err) { console.error("Snapshot failed:", err); }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] relative overflow-x-hidden">

      {/* WALLET INTEGRATION - CUSTOM DESIGN */}
      <div className="w-full max-w-5xl flex justify-end mb-4 z-50">
        <div className="onchainkit-custom">
          <Wallet>
            <ConnectWallet className="bg-[#1652F0] hover:bg-[#0039CB] text-white rounded-xl px-4 py-2 flex items-center gap-2 border-none">
              <Avatar className="h-6 w-6" />
              <Name className="text-white font-bold" />
            </ConnectWallet>
            <WalletDropdown className="bg-[#020617] border border-white/10 shadow-2xl">
              <Identity className="px-4 pt-3 pb-2 bg-[#020617] hover:bg-white/5" hasCopyAddressOnClick>
                <Avatar />
                <Name className="text-white font-bold" />
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

      {/* 1. ABSTAND: Header zu Reveal Box (mt-12) */}
      <main className="w-full max-w-3xl flex flex-col mt-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Link href="/">
            <div className="flex flex-col items-center cursor-pointer group">
              <img src={logoImage} className="h-[105px] w-auto mb-[-8px] drop-shadow-[0_0_20px_rgba(22,82,240,0.6)] group-hover:scale-105 transition-transform" />
              <h1 className="text-4xl font-extrabold text-white tracking-tighter glow-text leading-none mb-1">TimeCapsule</h1>
              <div className="w-[218px] border-t border-[#1652F0]/30 pt-2 flex flex-col items-center">
                <p className="text-[12px] text-[#CBD5E1] uppercase font-medium whitespace-nowrap text-center" style={{ letterSpacing: '0.076em', marginRight: '-0.076em' }}>Send a message to the future</p>
                <p className="text-[10px] text-[#1652F0] uppercase font-extrabold whitespace-nowrap text-center mt-1.5" style={{ letterSpacing: '0.14em', marginRight: '-0.14em' }}>Mint it as an NFT when revealed</p>
              </div>
            </div>
          </Link>
        </motion.div>

        <div className="glass-card rounded-3xl p-6 md:p-10 border border-[#1652F0]/30 shadow-[0_0_30px_rgba(22,82,240,0.15)] bg-black/40">
          {capsule.isRevealed ? (
            <div className="space-y-8">
              <RevealedMessage 
                 message={capsule.decryptedContent} 
                 sealerIdentity={capsule.sealerIdentity} 
                 sealedAt={capsule.createdAt} 
                 revealedAt={capsule.revealDate} 
                 capsuleId={capsule.id}
                 cardRef={cardRef} 
              />
              <div className="pt-6 border-t border-[#1652F0]/30">
                <Button onClick={handleDownloadImage} className="w-full h-14 bg-[#6366F1] hover:bg-[#5558E3] shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white font-bold rounded-xl text-lg">
                  <Camera className="mr-2 h-5 w-5" /> Save Capsule Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1652F0]/10 rounded-full ring-2 ring-[#1652F0]/30 animate-pulse">
                <Lock className="w-10 h-10 text-[#1652F0]" />
              </div>
              <h2 className="text-3xl font-bold text-white glow-text">Capsule Locked</h2>
              <CountdownTimer targetDate={new Date(capsule.revealDate)} />
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex justify-between text-sm font-mono text-[#1652F0]">
                <span className="text-[#CBD5E1]">Reveals at (UTC):</span>
                <span>{formatToStrictUTC(capsule.revealDate)}</span>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#1652F0]/30 space-y-4">
             <div className="bg-black/60 p-3 rounded-lg border border-[#1652F0]/20 flex items-center gap-2">
                <div className="text-sm text-[#1652F0] truncate flex-1 font-mono pl-2 opacity-80">{capsuleUrl}</div>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(capsuleUrl); setHasCopied(true); setTimeout(() => setHasCopied(false), 2000); }} className="hover:bg-white/10 hover:text-white text-[#CBD5E1]">{hasCopied ? <Check className="text-green-400 w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="border-[#855DCD]/30 hover:bg-[#855DCD]/10 text-white gap-2 h-12 rounded-xl" onClick={() => window.open(`https://warpcast.com/~/compose?text=Witness the message from the past!&embeds[]=${encodeURIComponent(capsuleUrl)}`, '_blank')}><SiFarcaster className="w-4 h-4 text-[#855DCD]" /> Share on Warpcast</Button>
                <Link href="/"><Button variant="ghost" className="w-full h-12 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl">Create New</Button></Link>
             </div>
          </div>
        </div>
      </main>

      {/* 2. ABSTAND: Reveal Box zu Tabelle (mt-12) */}
      <div className="w-full mt-12">
        <ArchiveTable />
      </div>

      <Footer />
    </div>
  );
}