import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Camera, Plus, Minus, CheckCircle2 } from "lucide-react";
import logoImage from "@assets/logo_final_1767063482143.png";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArchiveTable } from "@/components/ArchiveTable";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

// BLOCKCHAIN IMPORTS
import { 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  useAccount, 
  useSwitchChain
} from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton, useConnectModal } from '@rainbow-me/rainbowkit';

// ZORA CREATOR CONTRACT (Base)
const CAPSULE_CONTRACT_ADDRESS = "0x84eebe20e1536059dF1f658eD1F0181BC5e9B987";

// ZORA ABI
const ZORA_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "newURI", "type": "string" },
      { "internalType": "uint256", "name": "maxSupply", "type": "uint256" }
    ],
    "name": "setupNewToken",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

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

// DESIGN BLEIBT 1:1 UNVERÄNDERT
function RevealedMessage({ message, sealerIdentity, sealedAt, revealedAt, capsuleId, cardRef, isRevealed, isSnapshot = false }: any) {
  const capsuleUrl = `${window.location.origin}/capsule/${capsuleId}`;
  const d1 = new Date(sealedAt);
  const d2 = new Date(revealedAt);
  const isSameUTCDay = d1.getUTCFullYear() === d2.getUTCFullYear() && d1.getUTCMonth() === d2.getUTCMonth() && d1.getUTCDate() === d2.getUTCDate();
  const formatTimeUTC = (date: Date) => date.getUTCHours().toString().padStart(2, '0') + ":" + date.getUTCMinutes().toString().padStart(2, '0');
  const cardStyle = isSnapshot ? { width: '600px', height: '600px', minWidth: '600px', minHeight: '600px' } : { width: '100%', maxWidth: '600px', aspectRatio: '1/1' };

  return (
    <div className="flex justify-center w-full">
      <div className="relative shadow-2xl overflow-hidden border border-[#1652F0]/50 bg-[#020617] flex flex-col shrink-0" style={cardStyle} ref={cardRef} id={isSnapshot ? "capsule-card-capture" : "capsule-card-display"}>
        <div className="h-1.5 absolute top-0 left-0 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 z-20"></div>
        <div className="flex items-center justify-start gap-1.5 border-b border-white/10 pl-6 pr-8 header-block" style={{ height: '18.16%' }}>
           <img src={logoImage} alt="TC" className="w-16 h-auto" />
           <div className="flex flex-col header-text-container">
              <span className="font-display font-bold text-white text-4xl tracking-tight leading-none main-title-text">TimeCapsule</span>
              <span className="text-[11px] text-[#3B82F6] uppercase tracking-[0.25em] font-bold mt-2 subtitle-text">A Message to the Future</span>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-2 px-8 py-3 info-grid" style={{ height: '18.16%' }}>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center info-box-unit h-full overflow-visible">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5 label-text">Origin Identity</span>
                <div className="text-white font-bold truncate text-xs leading-none value-text">{sealerIdentity || 'Anonymous'}</div>
            </div>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center info-box-unit h-full overflow-visible">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5 label-text">Capsule ID</span>
                <div className="text-slate-400 truncate text-[9px] leading-none value-text capsule-id-text">{capsuleId}</div>
            </div>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center info-box-unit h-full overflow-visible">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5 label-text">Sealed At</span>
                <div className="text-[#3B82F6] text-[9px] leading-none value-text">{formatToStrictUTC(sealedAt)}</div>
            </div>
            <div className="bg-white/5 px-3 border border-white/5 flex flex-col justify-center info-box-unit h-full overflow-visible">
                <span className="text-slate-500 uppercase text-[7px] tracking-widest mb-0.5 label-text">Revealed At</span>
                <div className="text-emerald-400 text-[9px] leading-none value-text">{formatToStrictUTC(revealedAt)}</div>
            </div>
        </div>
        <div className="relative bg-black/40 border-y border-white/10 flex flex-col message-block" style={{ height: '45.5%' }}>
            <div className="text-[10px] text-white font-mono px-8 py-3 border-b border-white/5 intro-text-box">
              {isSameUTCDay ? (<>Written by {sealerIdentity || 'Anonymous'} on {formatSimpleDateUTC(sealedAt)} at {formatTimeUTC(d1)} to be read later at {formatTimeUTC(d2)}.</>) : (<>Written by {sealerIdentity || 'Anonymous'} on {formatSimpleDateUTC(sealedAt)} to be read in the future on {formatSimpleDateUTC(revealedAt)}.</>)}
            </div>
            <div className="flex-1 flex items-center justify-center relative px-12 main-content-box">
               {isRevealed ? (<><span className="absolute top-4 left-6 text-6xl text-cyan-500/10 font-serif quote-mark">"</span><p className="relative z-10 text-2xl leading-relaxed text-white font-serif font-light text-center italic message-paragraph">{message}</p><span className="absolute bottom-4 right-6 text-6xl text-purple-500/10 font-serif rotate-180 quote-mark">"</span></>) : (<motion.img initial={{ opacity: 0.3 }} animate={{ opacity: 0.6 }} src={logoImage} className="h-32 w-auto grayscale" />)}
            </div>
        </div>
        <div className="flex items-center justify-between px-8 footer-block" style={{ height: '18.16%' }}>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest space-y-1.5 font-medium footer-text-container"><p className="footer-line">• Immutable Record</p><p className="footer-line">• Secured on Base</p><p className="footer-line">• Verifiable Content</p></div>
            <div className="flex items-center gap-4 qr-box-container"><span className="text-[9px] text-slate-500 uppercase tracking-widest scan-label">Scan to Verify</span><div className="p-1.5 bg-white flex items-center justify-center qr-white-box"><QRCode size={45} value={capsuleUrl} bgColor="#FFFFFF" fgColor="#000000" /></div></div>
        </div>
      </div>
    </div>
  );
}

export default function CapsulePage({ id }: { id: string }) {
  const [mintAmount, setMintAmount] = useState(1);
  const [scale, setScale] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null); 
  const snapshotRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: capsule, isLoading, refetch }: any = useQuery({ queryKey: ['/api/capsules', id] });
  const { toast } = useToast();

  const { isConnected, chain, address } = useAccount(); // address hinzugefügt für DB Sync
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // WICHTIG: DIESER TEIL SCHLIEßT DEN KREIS ZUR DATENBANK
  useEffect(() => {
    if (isConfirmed && hash) {
      // 1. Notify Backend (DB Update)
      fetch(`/api/capsules/${id}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionHash: hash,
          authorAddress: address // Wer hat gemintet?
        })
      }).then(() => {
        // 2. UI Updates erst wenn DB Bescheid weiß
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.7 }, colors: ['#1652F0', '#00CFE8', '#FFFFFF'] });
        refetch(); 
        toast({ title: "Success", description: "NFT Edition created on Zora/Base and archived!" });
      }).catch(err => console.error("DB Sync Error", err));
    }
  }, [isConfirmed, hash, refetch, id, address, toast]);

  const handleCreateEditionAndMint = async () => {
    if (!capsule || !snapshotRef.current) return;
    setIsUploading(true);

    try {
      const canvas = await html2canvas(snapshotRef.current, {
        backgroundColor: "#020617",
        scale: 2,
        useCORS: true,
        width: 600,
        height: 600,
        onclone: (clonedDoc) => {
            const el = clonedDoc.getElementById('capsule-card-capture') as HTMLElement;
            if (el) {
              const headerText = el.querySelector('.header-text-container') as HTMLElement;
              if (headerText) headerText.style.transform = "translateY(-8px)";
              const infoBoxes = el.querySelectorAll('.info-box-unit');
              infoBoxes.forEach(box => {
                const b = box as HTMLElement;
                b.style.justifyContent = "flex-start"; b.style.paddingTop = "0px"; b.style.transform = "translateY(-4px)"; 
                const label = b.querySelector('.label-text') as HTMLElement; const val = b.querySelector('.value-text') as HTMLElement;
                if (label) { label.style.marginTop = "0px"; label.style.display = "block"; }
                if (val) { val.style.overflow = "visible"; val.style.whiteSpace = "nowrap"; }
              });
              const introBox = el.querySelector('.intro-text-box') as HTMLElement;
              if (introBox) introBox.style.transform = "translateY(-10px)"; 
              const footerText = el.querySelector('.footer-text-container') as HTMLElement;
              if (footerText) footerText.style.transform = "translateY(-6px)";
              const scanLabel = el.querySelector('.scan-label') as HTMLElement;
              if (scanLabel) { scanLabel.style.transform = "translateY(-5px)"; scanLabel.style.display = "inline-block"; }
            }
        }
      });

      canvas.toBlob(async (blob) => {
        if (!blob) { setIsUploading(false); return; }

        const formData = new FormData();
        formData.append("file", blob, `capsule-${capsule.id}.png`);
        formData.append("capsuleId", capsule.id);
        formData.append("identity", capsule.sealerIdentity || "Anonymous");
        formData.append("sealedAt", formatSimpleDateUTC(capsule.createdAt));

        const response = await fetch("/api/upload-ipfs", {
            method: "POST",
            body: formData
        });

        if (!response.ok) throw new Error("IPFS Upload failed");
        const data = await response.json();

        writeContract({
            address: CAPSULE_CONTRACT_ADDRESS as `0x${string}`,
            abi: ZORA_ABI,
            functionName: 'setupNewToken',
            args: [data.uri, BigInt(100)],
        });

        setIsUploading(false);
      }, "image/png");

    } catch (error) {
      console.error("Mint process failed:", error);
      setIsUploading(false);
      toast({ title: "Error", description: "Failed to upload or mint.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const availableWidth = containerRef.current.offsetWidth;
        const padding = 32;
        if ((availableWidth - padding) < 600) { setScale((availableWidth - padding) / 600); } else { setScale(1); }
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleDownloadImage = async () => {
    if (!snapshotRef.current) return;
    try {
        const canvas = await html2canvas(snapshotRef.current, { backgroundColor: "#020617", scale: 2, useCORS: true, width: 600, height: 600, onclone: (clonedDoc) => {
                const el = clonedDoc.getElementById('capsule-card-capture') as HTMLElement;
                if (el) {
                  const headerText = el.querySelector('.header-text-container') as HTMLElement;
                  if (headerText) headerText.style.transform = "translateY(-8px)";
                  const infoBoxes = el.querySelectorAll('.info-box-unit');
                  infoBoxes.forEach(box => {
                    const b = box as HTMLElement;
                    b.style.justifyContent = "flex-start"; b.style.paddingTop = "0px"; b.style.transform = "translateY(-4px)"; 
                    const label = b.querySelector('.label-text') as HTMLElement;
                    const val = b.querySelector('.value-text') as HTMLElement;
                    if (label) { label.style.marginTop = "0px"; label.style.display = "block"; }
                    if (val) { val.style.overflow = "visible"; val.style.whiteSpace = "nowrap"; }
                  });
                  const introBox = el.querySelector('.intro-text-box') as HTMLElement;
                  if (introBox) introBox.style.transform = "translateY(-10px)"; 
                  const footerText = el.querySelector('.footer-text-container') as HTMLElement;
                  if (footerText) footerText.style.transform = "translateY(-6px)";
                  const scanLabel = el.querySelector('.scan-label') as HTMLElement;
                  if (scanLabel) { scanLabel.style.transform = "translateY(-5px)"; scanLabel.style.display = "inline-block"; }
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
        <ConnectButton label="Connect Wallet" accountStatus="address" chainStatus="icon" showBalance={false} />
      </div>

      <main className="w-full max-w-4xl flex flex-col items-center mt-4" ref={containerRef}>
        <Header />

        <div className="flex flex-col items-center w-full">
          <div style={{ width: `${600 * scale}px`, height: `${600 * scale}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", width: '600px', height: '600px', flexShrink: 0 }}>
              <RevealedMessage message={capsule.decryptedContent} sealerIdentity={capsule.sealerIdentity} sealedAt={capsule.createdAt} revealedAt={capsule.revealDate} capsuleId={id} cardRef={cardRef} isRevealed={capsule.isRevealed} />
            </div>
          </div>

          <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
            <RevealedMessage isSnapshot={true} message={capsule.decryptedContent} sealerIdentity={capsule.sealerIdentity} sealedAt={capsule.createdAt} revealedAt={capsule.revealDate} capsuleId={id} cardRef={snapshotRef} isRevealed={capsule.isRevealed} />
          </div>

          <div className="flex flex-col gap-4 w-full mt-8" style={{ maxWidth: `${600 * scale}px` }}>
              <div className="w-full bg-white/5 border border-white/10 p-4 flex items-center justify-between rounded-xl min-h-[64px]">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Total Minted</span>
                    <span className="text-xl text-white font-mono leading-none">{capsule.mintCount || 0} / 100</span>
                </div>
                <div className="h-8 w-px bg-white/10 mx-4"></div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Price</span>
                    <span className="text-xl text-white font-mono leading-none">0.000777 ETH</span>
                </div>
              </div>

              <div className="w-full bg-white/5 border border-white/10 p-2 flex items-center justify-between gap-4 rounded-xl min-h-[64px]">
                <div className="flex items-center gap-3 pl-2">
                   <button disabled={isWritePending || isConfirming || isUploading} onClick={() => setMintAmount(Math.max(1, mintAmount - 1))} className="p-1 text-white hover:bg-white/10 transition-colors disabled:opacity-30"><Minus size={18}/></button>
                   <span className="text-xl font-mono font-bold text-white min-w-[25px] text-center">{mintAmount}</span>
                   <button disabled={isWritePending || isConfirming || isUploading} onClick={() => setMintAmount(Math.min(10, mintAmount + 1))} className="p-1 text-white hover:bg-white/10 transition-colors disabled:opacity-30"><Plus size={18}/></button>
                </div>

                {!isConnected ? (
                  <Button 
                    onClick={openConnectModal}
                    className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold h-full rounded-xl px-6 py-2 transition-all active:scale-95"
                  >
                    CONNECT WALLET
                  </Button>
                ) : chain?.id !== 8453 ? (
                  <Button onClick={() => switchChain({ chainId: 8453 })} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold h-full rounded-xl px-6 py-2 transition-all active:scale-95">SWITCH TO BASE</Button>
                ) : (
                  <Button 
                    onClick={handleCreateEditionAndMint} 
                    disabled={(capsule.mintCount || 0) >= 100 || isWritePending || isConfirming || isUploading} 
                    className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-90 text-white font-bold h-full rounded-xl px-6 py-2 transition-all active:scale-95"
                  >
                    {isUploading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : (isWritePending || isConfirming) ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : isConfirmed ? <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-400" /> : "MINT ON ZORA"}
                  </Button>
                )}
              </div>

              <Button onClick={handleDownloadImage} variant="outline" className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl min-h-[64px] py-4 flex items-center justify-center gap-2">
                <Camera size={18} /> Save Capsule Image
              </Button>
          </div>
        </div>
      </main>

      <div className="w-full mt-12"><ArchiveTable /></div>
      <Footer />
    </div>
  );
}