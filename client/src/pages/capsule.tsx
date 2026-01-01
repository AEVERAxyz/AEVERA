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

// WALLET IMPORTS
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

function formatToStrictUTC(dateString: string): string {
  const d = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
  };
  return d.toLocaleDateString('en-US', options) + ' UTC';
}

function formatSimpleDateUTC(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function RevealedMessage({ message, sealerIdentity, sealedAt, revealedAt, capsuleId, cardRef }: any) {
  const capsuleUrl = `${window.location.origin}/capsule/${capsuleId}`;

  // UTC-BASIERTER DATUMSVERGLEICH FIX
  const d1 = new Date(sealedAt);
  const d2 = new Date(revealedAt);
  const isSameUTCDay = d1.getUTCFullYear() === d2.getUTCFullYear() &&
                       d1.getUTCMonth() === d2.getUTCMonth() &&
                       d1.getUTCDate() === d2.getUTCDate();

  return (
    <div className="flex justify-center w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative shadow-2xl overflow-hidden rounded-none border border-[#1652F0]/50" 
        style={{ width: '600px', height: '600px', minWidth: '600px', minHeight: '600px' }}
        ref={cardRef}
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 via-blue-600/30 to-purple-600/30 blur-xl"></div>
        <div className="relative h-full w-full bg-[#020617] flex flex-col rounded-none">
          <div className="h-1.5 absolute top-0 left-0 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 z-20"></div>

          {/* TEIL 1: HEADER */}
          <div className="flex items-center justify-start gap-1.5 border-b border-white/10 pl-6 pr-8 rounded-none" style={{ flexBasis: '18.18%', height: '18.18%' }}>
             <img src={logoImage} alt="TC" className="w-16 h-auto drop-shadow-[0_0_20px_rgba(22,82,240,0.5)]" />
             <div className="flex flex-col justify-center">
                <span className="font-display font-bold text-white text-4xl tracking-tight leading-none">TimeCapsule</span>
                <span className="text-[11px] text-[#3B82F6] uppercase tracking-[0.25em] font-bold mt-2">A Message to the Future</span>
             </div>
          </div>

          {/* TEIL 2: INFOS */}
          <div className="grid grid-cols-2 gap-2 px-8 py-3 rounded-none" style={{ flexBasis: '18.18%', height: '18.18%' }}>
              <div className="bg-white/5 px-3 py-1 border border-white/5 flex flex-col justify-center rounded-none overflow-hidden h-full">
                  <span className="block text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Origin Identity</span>
                  <div className="text-white font-bold truncate text-xs leading-tight">{sealerIdentity || 'Anonymous'}</div>
              </div>
              <div className="bg-white/5 px-3 py-1 border border-white/5 flex flex-col justify-center rounded-none overflow-hidden h-full">
                  <span className="block text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Capsule ID</span>
                  <div className="text-cyan-400 truncate text-[8px] font-mono leading-tight">{capsuleId}</div>
              </div>
              <div className="bg-white/5 px-3 py-1 border border-white/5 flex flex-col justify-center rounded-none overflow-hidden h-full">
                  <span className="block text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Sealed At</span>
                  <div className="text-slate-300 text-[9px] leading-tight">{formatToStrictUTC(sealedAt)}</div>
              </div>
              <div className="bg-white/5 px-3 py-1 border border-white/5 flex flex-col justify-center rounded-none overflow-hidden h-full">
                  <span className="block text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Revealed At</span>
                  <div className="text-emerald-400 text-[9px] leading-tight">{formatToStrictUTC(revealedAt)}</div>
              </div>
          </div>

          {/* TEIL 3: TEXT - Mit UTC-Fix für den Jahreswechsel */}
          <div className="relative bg-black/40 border-y border-white/10 flex flex-col overflow-hidden rounded-none" style={{ flexBasis: '45.45%', height: '45.45%' }}>
              <div className="text-[10px] text-white font-mono px-8 py-3 border-b border-white/5 leading-relaxed">
                {isSameUTCDay ? (
                  <>
                    Written by {sealerIdentity || 'Anonymous'} on {formatSimpleDateUTC(sealedAt)} at {new Date(sealedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false, timeZone: 'UTC'})} to be read in the same day at {new Date(revealedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false, timeZone: 'UTC'})}.
                  </>
                ) : (
                  <>
                    Written by {sealerIdentity || 'Anonymous'} on {formatSimpleDateUTC(sealedAt)} to be read in the future on {formatSimpleDateUTC(revealedAt)}.
                  </>
                )}
              </div>
              <div className="flex-1 flex items-center justify-center relative px-12">
                 <span className="absolute top-4 left-6 text-6xl text-cyan-500/10 font-serif">"</span>
                 <p className="relative z-10 text-2xl leading-relaxed text-white font-serif font-light text-center italic drop-shadow-sm">{message}</p>
                 <span className="absolute bottom-4 right-6 text-6xl text-purple-500/10 font-serif rotate-180">"</span>
              </div>
          </div>

          {/* TEIL 4: FOOTER */}
          <div className="flex items-center justify-between px-8 rounded-none" style={{ flexBasis: '18.18%', height: '18.18%' }}>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest space-y-1.5 font-medium">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div><p>Immutable Record</p></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div><p>Secured on Base</p></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"></div><p>Verifiable Content</p></div>
              </div>
              <div className="flex items-center gap-4">
                 <span className="text-[9px] text-slate-500 uppercase tracking-widest">Scan to Verify</span>
                 <div className="p-1.5 bg-white rounded-none flex items-center justify-center shadow-lg">
                    <QRCode size={45} value={capsuleUrl} bgColor="#FFFFFF" fgColor="#000000" />
                 </div>
              </div>
          </div>
        </div>
      </motion.div>
    </div>
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

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
        const canvas = await html2canvas(cardRef.current, {
            backgroundColor: "#020617", scale: 2, useCORS: true, width: 600, height: 600
        });
        const link = document.createElement('a');
        link.download = `timecapsule-${id.slice(0,8)}.png`;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) { console.error("Snapshot failed:", err); }
  };

  if (isLoading || !capsule) return <div className="min-h-screen flex items-center justify-center bg-[#050A15]"><Loader2 className="animate-spin w-10 h-10 text-blue-500" /></div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] relative overflow-x-hidden">
      <div className="w-full max-w-5xl flex justify-end mb-4 z-50">
        <div className="onchainkit-custom">
          <Wallet>
            <ConnectWallet className="bg-[#1652F0] hover:bg-[#0039CB] text-white rounded-xl px-4 py-2 border-none flex items-center gap-2">
              <Avatar className="h-6 w-6" /><Name className="text-white font-bold" />
            </ConnectWallet>
            <WalletDropdown className="bg-[#020617] border border-white/10 shadow-2xl">
              <Identity className="px-4 pt-3 pb-2 bg-[#020617] hover:bg-white/5" hasCopyAddressOnClick>
                <Avatar /><Name className="text-white font-bold" /><Address className="text-blue-400" />
              </Identity>
              <WalletDropdownDisconnect className="hover:bg-red-500/10 text-red-500 font-bold bg-[#020617]" />
            </WalletDropdown>
          </Wallet>
        </div>
      </div>

      <main className="w-full max-w-4xl flex flex-col mt-4 md:mt-8 items-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Link href="/">
            <div className="flex flex-col items-center cursor-pointer group">
              <img src={logoImage} className="h-[105px] w-auto mb-[-8px] drop-shadow-[0_0_20px_rgba(22,82,240,0.6)] group-hover:scale-105 transition-transform" />
              <h1 className="text-4xl font-extrabold text-white tracking-tighter glow-text leading-none mb-1">TimeCapsule</h1>
            </div>
          </Link>
        </motion.div>

        {capsule.isRevealed ? (
          <div className="space-y-8 w-full flex flex-col items-center">
            <RevealedMessage message={capsule.decryptedContent} sealerIdentity={capsule.sealerIdentity} sealedAt={capsule.createdAt} revealedAt={capsule.revealDate} capsuleId={id} cardRef={cardRef} />
            <Button onClick={handleDownloadImage} className="w-full max-w-[600px] h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 shadow-[0_0_20px_rgba(37,99,235,0.4)] text-white font-bold rounded-none text-lg flex items-center justify-center gap-3">
              <Camera className="w-6 h-6" /> Save Capsule Image
            </Button>
          </div>
        ) : (
          <div className="glass-card rounded-none p-10 border border-[#1652F0]/30 bg-black/40 text-center w-full max-w-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#1652F0]/10 rounded-full ring-2 ring-[#1652F0]/30 animate-pulse mb-8">
              <Lock className="w-10 h-10 text-[#1652F0]" />
            </div>
            <h2 className="text-3xl font-bold text-white glow-text mb-4 uppercase">Capsule Locked</h2>
            <div className="bg-black/30 p-4 border border-white/5 flex justify-between text-sm font-mono text-[#1652F0]">
              <span className="text-slate-400">Reveals at (UTC):</span>
              <span>{formatToStrictUTC(capsule.revealDate)}</span>
            </div>
          </div>
        )}
      </main>

      <div className="w-full mt-12"><ArchiveTable /></div>
      <Footer />
    </div>
  );
}