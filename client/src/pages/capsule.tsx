import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Camera, Plus, Minus } from "lucide-react";
import logoImage from "@assets/logo_final_1767063482143.png";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
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
  revealDate: string;
  isRevealed: boolean;
  decryptedContent?: string;
  createdAt: string;
  sealerIdentity?: string;
  mintCount?: number;
}

function formatToStrictUTC(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', 
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' 
  }) + ' UTC';
}

function formatSimpleDateUTC(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function RevealedMessage({ message, sealerIdentity, sealedAt, revealedAt, capsuleId, cardRef, isRevealed }: any) {
  const capsuleUrl = `${window.location.origin}/capsule/${capsuleId}`;
  const d1 = new Date(sealedAt);
  const d2 = new Date(revealedAt);
  const isSameUTCDay = d1.getUTCFullYear() === d2.getUTCFullYear() &&
                       d1.getUTCMonth() === d2.getUTCMonth() &&
                       d1.getUTCDate() === d2.getUTCDate();

  return (
    <div className="flex justify-center w-full">
      <div 
        className="relative shadow-2xl overflow-hidden border border-[#1652F0]/50 bg-[#020617] flex flex-col" 
        style={{ width: '600px', height: '600px', minWidth: '600px', minHeight: '600px' }}
        ref={cardRef}
        id="capsule-card-snapshot"
      >
        <div className="h-1.5 absolute top-0 left-0 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 z-20"></div>

        {/* HEADER SECTION (109px) */}
        <div className="flex items-center justify-start gap-1.5 border-b border-white/10 pl-6 pr-8" style={{ height: '109px' }}>
           <img src={logoImage} alt="TC" className="w-16 h-auto" />
           <div className="flex flex-col">
              <span className="font-display font-bold text-white text-4xl tracking-tight leading-none">TimeCapsule</span>
              <span className="text-[11px] text-[#3B82F6] uppercase tracking-[0.25em] font-bold mt-2">A Message to the Future</span>
           </div>
        </div>

        {/* INFO BOXES (109px) */}
        <div className="grid grid-cols-2 gap-2 px-8 py-3" style={{ height: '109px' }}>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center overflow-hidden">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Origin Identity</span>
                <div className="text-white font-bold truncate text-xs leading-none">{sealerIdentity || 'Anonymous'}</div>
            </div>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center overflow-hidden">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Capsule ID</span>
                <div className="text-cyan-400 truncate text-[8px] font-mono leading-none">{capsuleId}</div>
            </div>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center overflow-hidden">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Sealed At</span>
                <div className="text-slate-300 text-[9px] leading-none">{formatToStrictUTC(sealedAt)}</div>
            </div>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center overflow-hidden">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5">Revealed At</span>
                <div className="text-emerald-400 text-[9px] leading-none">{formatToStrictUTC(revealedAt)}</div>
            </div>
        </div>

        {/* MESSAGE SECTION (273px) */}
        <div className="relative bg-black/40 border-y border-white/10 flex flex-col" style={{ height: '273px' }}>
            <div className="text-[10px] text-white font-mono px-8 py-3 border-b border-white/5">
              {isSameUTCDay ? (
                <>Written by {sealerIdentity || 'Anonymous'} on {formatSimpleDateUTC(sealedAt)} at {new Date(sealedAt).getUTCHours()}:{new Date(sealedAt).getUTCMinutes().toString().padStart(2, '0')} to be read later today.</>
              ) : (
                <>Written by {sealerIdentity || 'Anonymous'} on {formatSimpleDateUTC(sealedAt)} to be read in the future on {formatSimpleDateUTC(revealedAt)}.</>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center relative px-12">
               {isRevealed ? (
                  <>
                    <span className="absolute top-4 left-6 text-6xl text-cyan-500/10 font-serif">"</span>
                    <p className="relative z-10 text-2xl leading-relaxed text-white font-serif font-light text-center italic">{message}</p>
                    <span className="absolute bottom-4 right-6 text-6xl text-purple-500/10 font-serif rotate-180">"</span>
                  </>
               ) : (
                  <motion.img initial={{ opacity: 0.3 }} animate={{ opacity: 0.6 }} src={logoImage} className="h-32 w-auto grayscale" />
               )}
            </div>
        </div>

        {/* FOOTER SECTION (109px) */}
        <div className="flex items-center justify-between px-8" style={{ height: '109px' }}>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest space-y-1.5 font-medium">
                <p>• Immutable Record</p><p>• Secured on Base</p><p>• Verifiable Content</p>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-[9px] text-slate-500 uppercase tracking-widest">Scan to Verify</span>
               <div className="p-1.5 bg-white flex items-center justify-center">
                  <QRCode size={45} value={capsuleUrl} bgColor="#FFFFFF" fgColor="#000000" />
               </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function CapsulePage({ id }: { id: string }) {
  const [mintAmount, setMintAmount] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null); 
  const { data: capsule, isLoading }: any = useQuery({ queryKey: ['/api/capsules', id] });

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
        const canvas = await html2canvas(cardRef.current, {
            backgroundColor: "#020617",
            scale: 2,
            useCORS: true,
            width: 600,
            height: 600,
            onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById('capsule-card-snapshot') as HTMLElement;
                if (el) {
                  el.style.display = 'flex';
                  el.style.flexDirection = 'column';
                  el.style.justifyContent = 'flex-start';
                }
            }
        });
        const link = document.createElement('a');
        link.download = `timecapsule-${id.slice(0,8)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (err) { console.error("Snapshot failed", err); }
  };

  if (isLoading || !capsule) return <div className="min-h-screen flex items-center justify-center bg-[#050A15]"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15]">
      <div className="w-full max-w-5xl flex justify-end mb-4">
        <Wallet>
          <ConnectWallet className="bg-[#1652F0] text-white rounded-xl px-4 py-2"><Avatar className="h-6 w-6" /><Name /></ConnectWallet>
          <WalletDropdown><Identity hasCopyAddressOnClick><Avatar /><Name /><Address /></Identity><WalletDropdownDisconnect /></WalletDropdown>
        </Wallet>
      </div>

      <main className="w-full max-w-4xl flex flex-col items-center mt-4">
        <Header />

        <div className="space-y-8 w-full flex flex-col items-center">
          <RevealedMessage 
            message={capsule.decryptedContent} 
            sealerIdentity={capsule.sealerIdentity} 
            sealedAt={capsule.createdAt} 
            revealedAt={capsule.revealDate} 
            capsuleId={id} 
            cardRef={cardRef} 
            isRevealed={capsule.isRevealed} 
          />

          <div className="w-full max-w-[600px] flex flex-col gap-4">
             <div className="flex flex-col md:flex-row gap-4 items-stretch">
                <div className="flex-1 bg-white/5 border border-white/10 p-4 flex flex-col justify-center">
                   <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Total Minted</span>
                   <span className="text-2xl text-white font-mono">{capsule.mintCount || 0} / 100</span>
                </div>
                <div className="flex-[1.5] bg-white/5 border border-white/10 p-2 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3 pl-2">
                      <button onClick={() => setMintAmount(Math.max(1, mintAmount - 1))} className="p-2 text-white hover:bg-white/10 transition-colors"><Minus size={20}/></button>
                      <span className="text-2xl font-mono font-bold text-white min-w-[30px] text-center">{mintAmount}</span>
                      <button onClick={() => setMintAmount(Math.min(10, mintAmount + 1))} className="p-2 text-white hover:bg-white/10 transition-colors"><Plus size={20}/></button>
                   </div>
                   <Button disabled={(capsule.mintCount || 0) >= 100} className="flex-1 bg-[#1652F0] hover:bg-blue-600 text-white font-bold h-full rounded-none px-6">MINT NFT</Button>
                </div>
             </div>
             <Button onClick={handleDownloadImage} variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-none h-12 flex items-center justify-center gap-2"><Camera size={18} /> Save Capsule Image</Button>
          </div>
        </div>
      </main>
      <div className="w-full mt-12"><ArchiveTable /></div>
      <Footer />
    </div>
  );
}