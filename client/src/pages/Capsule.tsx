import React, { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Loader2, CheckCircle2, Lock, RefreshCw, Box, AlertTriangle, X, ExternalLink, User, Hash, Calendar, Sparkles, Link as LinkIcon, Eye, ArrowLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MintTable, MintEventData } from "@/components/MintTable";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import CryptoJS from 'crypto-js';
// FIX: readContracts hinzufügen für Batch-Abfragen (wie ArchiveTable)
import { readContract, readContracts } from '@wagmi/core';
import { config } from "../OnchainProviders";
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain, usePublicClient } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { fromHex, isHex, formatEther } from "viem";

// --- KORREKTE DATEINAMEN FÜR V2 ---
import AeveraVaultABI from "../abis/AeveraEternalVault.json"; 
import AeveraGatewayABI from "../abis/AeveraGateway.json";

// --- CONFIG ---
import { APP_CONFIG } from "../lib/config";

// --- DRAND ---
import { timelockDecrypt } from "tlock-js";

// --- ICONS ---
import { SiFarcaster, SiX } from "react-icons/si";

const CHAIN_HASH = "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";
const DRAND_URL = "https://api.drand.sh";

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="min-h-screen bg-[#050A15] text-red-500 p-10 flex flex-col items-center justify-center"><h1>Display Error</h1><p className="text-slate-500 mt-2 text-sm">{this.state.error?.toString()}</p></div>;
    return this.props.children;
  }
}

const MINT_PRICE = BigInt("777000000000000"); 

// DATE HELPERS
function formatToStrictUTC(ts: number): string {
  if (!ts) return "...";
  const date = new Date(ts > 10000000000 ? ts : ts * 1000); 
  if(isNaN(date.getTime())) return "...";
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
}

// ------------------------------------------------------------------
// 1. NFT PREVIEW MODAL
// ------------------------------------------------------------------
function NFTDetailModal({ nft, capsule, isOpen, onClose }: { nft: MintEventData | null, capsule: any, isOpen: boolean, onClose: () => void }) {
    const [metadata, setMetadata] = useState<{ image: string, name: string, description: string, attributes: any[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const publicClient = usePublicClient();

    useEffect(() => {
        if (isOpen && capsule && nft && publicClient) {
            fetchRawMetadata();
        } else {
            setMetadata(null);
            setError(null);
        }
    }, [isOpen, capsule, nft, publicClient]);

    const fetchRawMetadata = async () => {
        setLoading(true);
        setError(null);
        try {
            const uriResult = await readContract(config, {
                address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`,
                abi: AeveraVaultABI,
                functionName: 'uri',
                args: [capsule.id]
            });

            let uriString = String(uriResult);
            // eslint-disable-next-line no-control-regex
            uriString = uriString.replace(/\x00/g, ''); 

            if (isHex(uriString)) {
                try {
                    uriString = fromHex(uriString as `0x${string}`, 'string');
                    // eslint-disable-next-line no-control-regex
                    uriString = uriString.replace(/\x00/g, '');
                } catch(e) { console.warn("Hex decode skipped"); }
            }

            if (uriString.includes('base64,')) {
                uriString = uriString.split('base64,')[1];
            }

            try {
                uriString = uriString.replace(/\s/g, '');
                const jsonString = atob(uriString);
                const json = JSON.parse(jsonString);

                if (json.image && json.image.includes('base64,')) {
                    // eslint-disable-next-line no-control-regex
                    json.image = json.image.replace(/\x00/g, '');
                }
                setMetadata(json);
            } catch (decodeErr) {
                throw new Error("Base64 format invalid");
            }

        } catch (err: any) {
            console.error("Metadata fetch failed:", err);
            setError("Failed to decode blockchain data.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !nft) return null;

    const formattedDate = new Date(Number(nft.timestamp) * 1000).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="bg-[#0A0F1E] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden block max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="w-full overflow-x-auto custom-scrollbar">
                    <div className="h-[500px]" style={{ display: 'flex', flexDirection: 'row', minWidth: '800px' }}>
                        <div className="w-1/2 bg-black flex items-center justify-center p-8 border-r border-white/10 relative overflow-hidden shrink-0 h-full">
                            <div className="aspect-square w-full max-w-[350px] shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center bg-[#020617] rounded-lg overflow-hidden relative">
                                {loading ? (
                                    <div className="flex flex-col items-center gap-3 text-slate-500 animate-pulse">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                        <span className="text-xs font-mono uppercase tracking-widest">FETCHING FROM CHAIN...</span>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center gap-2 text-red-400 p-4 text-center">
                                        <AlertTriangle className="w-8 h-8 opacity-80" />
                                        <span className="text-xs font-mono uppercase tracking-widest">FAILED TO LOAD</span>
                                    </div>
                                ) : metadata ? (
                                    <img src={metadata.image} alt="Artifact" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-xs text-slate-600">No Data</span>
                                )}
                            </div>
                        </div>

                        <div className="w-1/2 flex flex-col bg-[#0A0F1E] shrink-0 h-full">
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <div>
                                    <h3 className="text-xl font-bold text-white font-display">{nft.type === 'GENESIS' ? 'Genesis Artifact' : `Standard Edition`}</h3>
                                    <p className="text-sm text-slate-400">{capsule.isPrivate ? 'Private Vault Lineage' : 'Public Broadcast Lineage'}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/10 text-slate-400 hover:text-white rounded-full"><X className="w-5 h-5" /></Button>
                            </div>
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500 uppercase tracking-widest font-bold">Current Collector</label>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/10"><User className="w-4 h-4 text-slate-400" /></div>
                                        <div className="overflow-hidden">
                                            <p className="text-sm text-white font-mono truncate w-full">{nft.minter}</p>
                                            {nft.type === 'GENESIS' && <span className="text-[10px] text-cyan-400 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-500/20 mt-1 inline-block">ORIGINAL AUTHOR</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2 text-slate-400"><Hash className="w-3 h-3" /><span className="text-[10px] uppercase tracking-wider">ID</span></div>
                                        <p className="text-lg font-mono text-white font-bold">#{capsule.shortId}</p>
                                    </div>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2 text-slate-400"><Calendar className="w-3 h-3" /><span className="text-[10px] uppercase tracking-wider">Minted</span></div>
                                        <p className="text-sm text-white font-mono">{formattedDate}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-500 uppercase tracking-widest font-bold">About this Artifact</label>
                                    {metadata ? (
                                        <div className="text-sm text-slate-400 leading-relaxed border-l-2 border-white/10 pl-3">
                                            <p className="mb-2 italic text-slate-300">"{metadata.description}"</p>
                                        </div>
                                    ) : <p className="text-sm text-slate-600 italic">Description unavailable.</p>}
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-[#050A15]">
                                <a href={`${APP_CONFIG.EXPLORER_URL}/tx/${nft.txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-black hover:bg-slate-200 font-bold rounded-lg transition-colors text-sm uppercase tracking-wide">
                                    VIEW ON BLOCKCHAIN <ExternalLink className="w-4 h-4 ml-2" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ------------------------------------------------------------------
// 2. COUNTDOWN TIMER
// ------------------------------------------------------------------
function CountdownTimer({ targetDate, onComplete }: { targetDate: number | null, onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const targetMs = targetDate > 10000000000 ? targetDate : targetDate * 1000;
      const distance = targetMs - now;

      if (distance < 0) { 
          clearInterval(interval); 
          setTimeLeft(null);
          onComplete(); 
      } else { 
          setTimeLeft({ 
              days: Math.floor(distance / (1000 * 60 * 60 * 24)), 
              hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)), 
              minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)), 
              seconds: Math.floor((distance % (1000 * 60)) / 1000) 
          }); 
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (!targetDate) return <div className="text-white animate-pulse">Synchronizing...</div>;
  if (!timeLeft) return null; 

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center gap-2 text-[#3B82F6] mb-2"><Lock className="w-5 h-5 animate-pulse" /><span className="text-sm font-bold tracking-widest uppercase">Content Locked</span></div>
      <div className="grid grid-flow-col gap-4 text-center auto-cols-max">
        {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
           <div key={unit} className={`flex flex-col p-2 bg-white/5 rounded-xl border border-white/10 min-w-[4rem] w-auto px-3 ${unit === 'seconds' ? 'shadow-[0_0_15px_rgba(22,82,240,0.3)]' : ''}`}>
             <span className={`countdown font-mono text-3xl font-bold ${unit === 'seconds' ? 'text-[#3B82F6]' : 'text-white'}`}>
               {/* @ts-ignore */}
               {timeLeft?.[unit]}
             </span>
             <span className={`text-[10px] uppercase ${unit === 'seconds' ? 'text-[#3B82F6]' : 'text-slate-400'}`}>{unit === 'minutes' ? 'min' : unit === 'seconds' ? 'sec' : unit}</span>
           </div>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 3. REVEALED MESSAGE
// ------------------------------------------------------------------
function RevealedMessage({ message, sealerIdentity, sealedAt, revealedAt, capsuleId, isRevealed, isPrivate, onDecrypt, needsPassword, onTimerEnd, isDecrypting, hasAccess, openConnectModal, isConnected }: any) {

  const colors = {
    bg: "#020617",
    publicGradientStart: "#22d3ee", 
    publicGradientEnd: "#2563eb",   
    privateGradientStart: "#c084fc", 
    privateGradientEnd: "#db2777",   
    textMain: "#ffffff",
    textDim: "#94a3b8", 
    accentPublic: "#22d3ee",
    accentPrivate: "#e879f9",
    border: "#1e293b"
  };

  const accentColor = isPrivate ? colors.accentPrivate : colors.accentPublic;
  const gradientStyle = {
      background: `linear-gradient(90deg, ${isPrivate ? colors.privateGradientStart : colors.publicGradientStart}, ${isPrivate ? colors.privateGradientEnd : colors.publicGradientEnd})`
  };

  const sealedTs = Number(sealedAt) > 10000000000 ? Number(sealedAt) : Number(sealedAt) * 1000;
  const revealedTs = Number(revealedAt) > 10000000000 ? Number(revealedAt) : Number(revealedAt) * 1000;

  let displayAuthor = sealerIdentity || "Loading...";
  if (displayAuthor.length > 22) displayAuthor = displayAuthor.substring(0, 20) + "...";

  const [passwordInput, setPasswordInput] = useState("");
  const [localRevealed, setLocalRevealed] = useState(isRevealed);

  useEffect(() => { setLocalRevealed(isRevealed); }, [isRevealed]);

  const handleTimerFinish = () => {
      setLocalRevealed(true);
      if(onTimerEnd) onTimerEnd();
  };

  const getDateString = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const getTimeString = (ts: number) => {
    return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
  };

  const sealedDateStr = getDateString(sealedTs);
  const revealedDateStr = getDateString(revealedTs);
  const revealedTimeStr = getTimeString(revealedTs);
  const isSameDay = sealedDateStr === revealedDateStr;

  const cardStyle = { 
      width: '600px', 
      height: '600px', 
      backgroundColor: colors.bg,
      position: 'relative' as 'relative',
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column' as 'column',
      userSelect: 'none' as 'none' 
  };

  return (
    <div style={cardStyle} className="border border-[#1e293b]">
        <div style={{...gradientStyle, width: '100%', height: '6px', position: 'absolute', top: 0, left: 0, zIndex: 50}}></div>

        <div className="h-[90px] shrink-0 w-full px-8 flex flex-col justify-center items-start border-b border-white/5 relative z-10 mt-1">
            <div className="flex flex-col items-center text-center">
                <h1 className="text-white font-bold text-4xl tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.5)] leading-none">AEVERA</h1>
                <div className="flex flex-col items-center leading-tight mt-1">
                    <p className="text-[#CBD5E1] text-[10px] tracking-[0.6em] font-bold">BEYOND TIME</p>
                    <p className="text-[#60A5FA] text-[8px] tracking-[0.3em] font-bold mt-[2px]">THE EVERLASTING TRUTH</p>
                </div>
            </div>
        </div>

        <div className="shrink-0 w-full px-8 py-3 flex items-center justify-center border-b border-white/5 bg-[#020617]">
            <div className="w-full grid grid-cols-2 gap-2">
                <div className="bg-[#050a15] px-3 py-1.5 border border-white/10 rounded-sm flex flex-col justify-center text-left shadow-inner h-[42px]">
                    <p className="text-[#94a3b8] text-[7px] font-mono uppercase tracking-widest leading-none mb-1">ORIGIN IDENTITY</p>
                    <p className="text-white text-[10px] font-bold truncate leading-none">{displayAuthor}</p>
                </div>
                <div className="bg-[#050a15] px-3 py-1.5 border border-white/10 rounded-sm flex flex-col justify-center text-left shadow-inner h-[42px]">
                    <p className="text-[#94a3b8] text-[7px] font-mono uppercase tracking-widest leading-none mb-1">CAPSULE ID</p>
                    <p className="text-[#94a3b8] text-[11px] font-bold font-mono tracking-widest leading-none">#{capsuleId}</p>
                </div>
                <div className="bg-[#050a15] px-3 py-1.5 border border-white/10 rounded-sm flex flex-col justify-center text-left shadow-inner h-[42px]">
                    <p className="text-[#94a3b8] text-[7px] font-mono uppercase tracking-widest leading-none mb-1">MOMENT OF ORIGIN</p>
                    <p className="text-[#3B82F6] text-[10px] font-bold truncate leading-none">{formatToStrictUTC(sealedTs/1000)}</p>
                </div>
                <div className="bg-[#050a15] px-3 py-1.5 border border-white/10 rounded-sm flex flex-col justify-center text-left shadow-inner h-[42px]">
                    <p className="text-[#94a3b8] text-[7px] font-mono uppercase tracking-widest leading-none mb-1">THE ERA OF REVEAL</p>
                    <p className="text-[#34d399] text-[10px] font-bold truncate leading-none">{formatToStrictUTC(revealedTs/1000)}</p>
                </div>
            </div>
        </div>

        <div className="w-full px-8 py-2 flex items-center justify-center bg-[#020617] border-b border-white/5">
            <p className="text-white text-[13px] font-serif italic text-center leading-relaxed">
                {isSameDay ? (
                     <>
                        Sent beyond time by <span className="font-semibold not-italic">{displayAuthor}</span> on {sealedDateStr}, arriving later at <span className="font-semibold not-italic">{revealedTimeStr}</span>.
                     </>
                ) : (
                     <>
                        Sent beyond time by <span className="font-semibold not-italic">{displayAuthor}</span> on {sealedDateStr}, arriving on <span className="font-semibold not-italic">{revealedDateStr}</span>.
                     </>
                )}
            </p>
        </div>

        <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-[#020617]">
             <div className="relative z-20 w-full h-full flex flex-col">
               {localRevealed ? (
                 needsPassword ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 w-full max-w-xs z-30 animate-in fade-in zoom-in-95 mx-auto">
                        <p className="text-center text-xs text-[#94a3b8] uppercase tracking-widest mb-2 font-mono">
                            {isDecrypting ? "DECRYPTING TIMELOCK..." : (isPrivate ? "VAULT LOCKED" : "ENCRYPTED")}
                        </p>
                        {isDecrypting ? (
                            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        ) : isPrivate ? (
                            !isConnected ? (
                                <Button onClick={openConnectModal} className="bg-slate-800 hover:bg-slate-700 text-white font-bold tracking-wider text-xs h-10 w-full">CONNECT WALLET</Button>
                            ) : !hasAccess ? (
                                <div className="text-center">
                                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2 opacity-80" />
                                    <p className="text-red-400 text-xs font-bold uppercase tracking-widest mb-1">ACCESS DENIED</p>
                                    <p className="text-slate-500 text-[10px]">You need the Key-NFT to unlock this vault.</p>
                                </div>
                            ) : (
                                <>
                                    <Input type="password" placeholder="Enter Secret Key..." className="bg-black/50 border border-[#94a3b8]/30 text-white text-center h-10 font-mono focus:border-purple-500" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} />
                                    <Button onClick={() => onDecrypt(passwordInput)} className="bg-purple-600 hover:bg-purple-500 text-white font-bold tracking-wider text-xs h-10 w-full">UNLOCK VAULT</Button>
                                </>
                            )
                        ) : (
                            <Button onClick={() => onDecrypt("")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wider text-xs h-10 w-full">DECRYPT MESSAGE</Button>
                        )}
                    </div>
                 ) : (
                    <div className="w-full h-full overflow-y-auto custom-scrollbar relative">
                        {message ? (
                             <div className="min-h-full flex flex-col items-center justify-center px-12 py-8 text-center">
                                 <p className="text-lg md:text-xl leading-relaxed text-white font-serif italic whitespace-pre-wrap">
                                   "{message}"
                                 </p>
                             </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-500">
                                <AlertTriangle className="w-8 h-8 opacity-50" />
                                <span className="text-xs uppercase tracking-widest font-mono">No Content Found</span>
                             </div>
                        )}
                    </div>
                 )
               ) : (
                  <div className="scale-90 flex items-center justify-center h-full">
                      <CountdownTimer targetDate={Number(revealedAt)} onComplete={handleTimerFinish} />
                  </div>
               )}
             </div>
        </div>

        <div className="h-[80px] shrink-0 w-full px-8 flex justify-between items-center bg-[#020617] border-t border-white/5 relative z-30">
            <div className="text-[#94a3b8] text-[10px] font-mono tracking-[0.2em] leading-relaxed flex flex-col justify-center">
                <p>• VERIFIED</p>
                <p>• ETERNAL</p>
                <p>• AEVERA</p>
            </div>
            <div className="flex flex-col justify-center items-center text-center">
                <p className="text-[10px] font-bold font-mono mb-1 uppercase tracking-widest" style={{ color: accentColor }}>TYPE: {isPrivate ? "PRIVATE VAULT" : "PUBLIC BROADCAST"}</p>
                <p className="text-[#94a3b8] text-[9px] max-w-[150px] leading-tight font-sans">
                    {isPrivate ? "Restricted to NFT holder & Key." : "Open to the world after Reveal Era."}
                </p>
            </div>
        </div>

    </div>
  );
}

// ------------------------------------------------------------------
// 4. MAIN CAPSULE CONTENT
// ------------------------------------------------------------------
function CapsuleContent() {
  const { id: searchId } = useParams();
  const [capsule, setCapsule] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Initializing...");
  const [scale, setScale] = useState(1);
  const [hasAccess, setHasAccess] = useState(false); 
  const [gatewayAddr, setGatewayAddr] = useState<string | null>(null); 

  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptedText, setDecryptedText] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);

  const isDecryptingRef = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const [forceUpdate, setForceUpdate] = useState(0); 
  const [selectedNft, setSelectedNft] = useState<MintEventData | null>(null);

  const [mintSuccessHash, setMintSuccessHash] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const { isConnected, address, chain } = useAccount(); 
  const { switchChain } = useSwitchChain();
  const { openConnectModal } = useConnectModal();

  const { writeContract, data: hash, isPending: isWritePending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
      const checkAccess = async () => {
          if (!capsule || !address || !isConnected) {
              setHasAccess(false);
              return;
          }
          if (!capsule.isPrivate) {
              setHasAccess(true); 
              return;
          }
          try {
              const balance = await readContract(config, {
                  address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`,
                  abi: AeveraVaultABI,
                  functionName: 'balanceOf',
                  args: [address, capsule.id]
              }) as bigint;

              setHasAccess(balance > 0n);
          } catch (e) {
              console.error("Access check failed", e);
              setHasAccess(false);
          }
      };

      checkAccess();
  }, [capsule, address, isConnected, forceUpdate]);

  // FIX: BATCH SEARCH FETCHING (Wie ArchiveTable)
  const fetchCapsule = async () => {
        if (!searchId) return;

        if (capsule && (capsule.shortId !== searchId && capsule.uuid !== searchId)) {
            setCapsule(null);
            setLoading(true);
            setStatusMsg("Accessing Base Blockchain...");
        } else if (!capsule && loading) {
            setLoading(true);
            setStatusMsg("Accessing Base Blockchain...");
        }

        try {
            try {
               const gw = await readContract(config, { 
                   address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`, 
                   abi: AeveraVaultABI, 
                   functionName: 'gateway' 
               }) as string;
               setGatewayAddr(gw);
            } catch(e) {}

            let tokenId = 0n;

            // --- STRATEGIE: BATCH FETCH (DIE "RICHTIGE FRAGE") ---
            // Wir scannen die letzten 50 Kapseln auf einmal und suchen PRIMÄR nach der ShortID.
            // Das löst das Kollisions-Problem, da wir data[2] (ShortID) exakt prüfen.
            try {
                const nextId = await readContract(config, { address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`, abi: AeveraVaultABI, functionName: 'nextTokenId' }) as bigint;
                const maxId = Number(nextId) - 1;

                if (maxId > 0) {
                    const idsToScan = [];
                    const limit = Math.max(0, maxId - 50); 
                    for (let i = maxId; i > limit; i--) {
                        idsToScan.push(BigInt(i));
                    }

                    const results = await readContracts(config, {
                        contracts: idsToScan.map(id => ({
                            address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`,
                            abi: AeveraVaultABI as any,
                            functionName: 'capsules',
                            args: [id]
                        }))
                    });

                    // WICHTIG: Wir filtern hier nach der SHORT-ID (data[2]).
                    // Selbst wenn eine UUID "AEVERA" heißt, ignorieren wir sie, wenn die ShortID nicht passt.
                    const matchIndex = results.findIndex(res => {
                        if (res.status !== 'success' || !res.result) return false;
                        const d = res.result as any;
                        // V2 Struct: [creator, author, shortId, uuid...]
                        return d[2] === searchId; 
                    });

                    if (matchIndex !== -1) {
                        tokenId = idsToScan[matchIndex];
                    }
                }
            } catch(e) { console.warn("Batch scan error", e); }

            // FALLBACK für alte Kapseln (außerhalb der letzten 50) oder UUID-Links
            // Nur ausführen, wenn oben NICHTS gefunden wurde.
            if (tokenId === 0n) {
                try {
                   // Versuch als UUID (z.B. wenn jemand einen alten UUID-Link nutzt)
                   const idFromUuid = await readContract(config, { address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`, abi: AeveraVaultABI, functionName: 'idByUuid', args: [searchId] }) as bigint;
                   if (idFromUuid > 0n) tokenId = idFromUuid;
                   else {
                       // Versuch als direkte ID (Zahl)
                       try {
                           const directId = BigInt(searchId);
                           const nextId = await readContract(config, { address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`, abi: AeveraVaultABI, functionName: 'nextTokenId' }) as bigint;
                           if (directId > 0n && directId < nextId) tokenId = directId;
                       } catch(e) {}
                   }
                } catch (e) {}
            }

            if (tokenId === 0n) {
                console.warn("Capsule not found.");
                setCapsule(null);
                setLoading(false);
                return;
            }

            // 2. Fetch Metadata (Finaler Abruf mit korrekter ID)
            const data: any = await readContract(config, { address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`, abi: AeveraVaultABI, functionName: 'capsules', args: [tokenId] });

            // SAFETY CHECK: Double check gegen Ghost Data
            // Wenn ShortID und UUID und ID nicht passen -> Fehler.
            if (data[2] !== searchId && data[3] !== searchId && tokenId.toString() !== searchId) {
                 console.warn("Mismatch detected! Capsule data does not match URL ID.");
                 setCapsule(null);
                 setLoading(false);
                 return;
            }

            const supply = await readContract(config, { address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`, abi: AeveraVaultABI, functionName: 'totalSupplyPerId', args: [tokenId] }) as bigint;

            let content = ""; 
            const nowSec = Math.floor(Date.now() / 1000);
            const unlockTime = Number(data[5]); 
            const isRevealed = nowSec >= unlockTime;
            const isPrivate = data[6];

            if (isRevealed || isPrivate) {
                try {
                    const contentResult = await readContract(config, { address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`, abi: AeveraVaultABI, functionName: 'getContent', args: [tokenId] }) as string;
                    let cleanContent = contentResult;

                    if (isHex(cleanContent)) {
                        try { cleanContent = fromHex(cleanContent, 'string'); } catch(e) {}
                    }
                    // eslint-disable-next-line no-control-regex
                    cleanContent = cleanContent.replace(/\x00/g, '').trim();

                    try {
                        if (cleanContent.startsWith('"') || cleanContent.startsWith('{')) {
                             const parsed = JSON.parse(cleanContent);
                             content = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
                        } else {
                             content = cleanContent;
                        }
                    } catch (jsonErr) {
                        content = cleanContent;
                    }
                } catch (err) { console.warn("Content read failed", err); }
            }

            if (!isPrivate && isRevealed && !content) {
                setTimeout(() => setForceUpdate(n => n + 1), 1000);
            }

            setCapsule({
                id: tokenId,
                uuid: data[3],
                shortId: data[2],
                author: data[1],
                creator: data[0],
                sealerName: data[1],
                contentEncrypted: content, 
                createdAt: Number(data[4]),
                unlockTime: unlockTime,
                isPrivate: isPrivate,
                maxSupply: isPrivate ? 1000 : 100,
                mintedCount: Number(supply),
                isRevealed: isRevealed
            });

        } catch (e) { 
            console.error("Fetch Error:", e); 
            if(!capsule) setCapsule(null); 
        } finally { 
            setLoading(false); 
        }
  };

  useEffect(() => { fetchCapsule(); }, [searchId, forceUpdate]);

  useEffect(() => {
      if (!capsule || capsule.isPrivate || !capsule.isRevealed || isDecrypted) return;
      if (capsule.contentEncrypted) {
          if(pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          if (!isDecryptingRef.current) handleDecrypt(capsule.contentEncrypted);
      } else {
          if (!pollingRef.current) {
              pollingRef.current = setInterval(() => setForceUpdate(prev => prev + 1), 1000);
          }
          if (!isDecrypting) setIsDecrypting(true);
      }
      return () => { if(pollingRef.current) clearInterval(pollingRef.current); };
  }, [capsule, isDecrypted, isDecrypting, forceUpdate]);

  const handleTimerComplete = () => { 
      if(capsule) {
          setCapsule((prev: any) => ({ ...prev, isRevealed: true }));
          if (!capsule.isPrivate) setIsDecrypting(true); else setIsDecrypting(false); 
      }
      setForceUpdate(prev => prev + 1);
  };

  const handleDecrypt = async (input: string) => {
      if (!capsule) return;
      if (!capsule.isPrivate && !input) return;
      if (isDecryptingRef.current) return;
      isDecryptingRef.current = true;
      setIsDecrypting(true);

      try {
          const response = await fetch(`${DRAND_URL}/${CHAIN_HASH}/info`);
          if (!response.ok) throw new Error("Drand Network Error");
          const chainInfo = await response.json();

          const safeClient = {
              chain: () => ({ info: () => Promise.resolve(chainInfo) }),
              get: async (round: number) => {
                  const res = await fetch(`${DRAND_URL}/${CHAIN_HASH}/public/${round}`);
                  return res.json();
              },
              options: () => ({}) 
          };

          const decryptedBytes = await timelockDecrypt(capsule.contentEncrypted, safeClient as any);
          const intermediateString = new TextDecoder().decode(decryptedBytes);
          let finalMessage = intermediateString;

          if (capsule.isPrivate) {
              const password = input; 
              const bytes = CryptoJS.AES.decrypt(intermediateString, password);
              const originalText = bytes.toString(CryptoJS.enc.Utf8);
              if (!originalText) throw new Error("Wrong password");
              finalMessage = originalText;
          }

          setDecryptedText(finalMessage);
          setIsDecrypted(true);
          if(capsule.isPrivate) toast({ title: "Success", description: "Vault unlocked.", className: "bg-green-600 text-white" });

      } catch (e: any) {
          console.error("Decryption failed:", e);

          const isNetworkError = e.message?.toLowerCase().includes("network") ||
                                 e.message?.toLowerCase().includes("fetch") ||
                                 e.message?.toLowerCase().includes("drand");

          if (isNetworkError) {
              toast({ title: "Network Error", description: "Could not reach Drand network. Please retry.", variant: "destructive" });
              setIsDecrypting(false);
              isDecryptingRef.current = false;
              return;
          }

          if (!capsule.isPrivate) {
               console.warn("Falling back to plaintext display.");
               let plainText = typeof capsule.contentEncrypted === 'string'
                  ? capsule.contentEncrypted
                  : JSON.stringify(capsule.contentEncrypted);

               setDecryptedText(plainText);
               setIsDecrypted(true);
               toast({
                   title: "⚠️ Unsecured Message",
                   description: "Content was written directly to contract (Plaintext).",
                   className: "bg-yellow-600 text-white"
               });
               setIsDecrypting(false);
               isDecryptingRef.current = false;
               return;
          }

          let msg = "Decryption failed.";
          if(e.message?.includes("Wrong password") || e.message?.includes("Malformed")) msg = "Wrong Password."; 
          if(capsule.isPrivate) toast({ title: "Error", description: msg, variant: "destructive" });
      } finally {
          setIsDecrypting(false);
          isDecryptingRef.current = false;
      }
  };

  const handleMint = () => {
      if(!capsule || !gatewayAddr) {
          if(!gatewayAddr) toast({ title: "Error", description: "Gateway not found.", variant: "destructive" });
          return;
      }

      const gw = gatewayAddr || APP_CONFIG.GATEWAY_ADDRESS;

      writeContract({ 
          address: gw as `0x${string}`, 
          abi: AeveraGatewayABI, 
          functionName: 'mintCopy', 
          args: [address, capsule.id, BigInt(quantity), false], 
          value: MINT_PRICE * BigInt(quantity) 
      });
  };

  useEffect(() => { 
      if (isConfirmed && hash && mintSuccessHash !== hash) { 
          toast({ title: "Minted!", description: `${quantity} NFT(s) added to your wallet.` });
          setMintSuccessHash(hash);
          setCapsule((prev: any) => {
              if(!prev) return null;
              return { ...prev, mintedCount: Number(prev.mintedCount) + quantity };
          });
          setTimeout(() => setForceUpdate(prev => prev + 1), 2000);
      } 
  }, [isConfirmed, hash, toast, quantity, mintSuccessHash]); 

  const handleCloseSuccess = () => {
      setMintSuccessHash(null);
      reset(); 
  };

  useEffect(() => { const updateScale = () => { if (containerRef.current) { const availableWidth = containerRef.current.offsetWidth; if ((availableWidth - 32) < 600) setScale((availableWidth - 32) / 600); else setScale(1); } }; updateScale(); window.addEventListener("resize", updateScale); return () => window.removeEventListener("resize", updateScale); }, []);

  const handleShareWarpcastMint = () => {
      if(!capsule) return;
      const url = `${window.location.origin}/capsule/${capsule.shortId}`;
      const text = `I just minted an eternal artifact on @aevera. \nA piece of history secured on Base. 🔵 #AEVERA\n\nMint yours here:`;
      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank');
  };

  const handleShareXMint = () => {
      if(!capsule) return;
      const url = `${window.location.origin}/capsule/${capsule.shortId}`;
      const text = `I just minted an eternal artifact on @AEVERAxyz.\nA piece of history secured on @base. 🔵 #AEVERA\n\nMint yours here:`;
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank');
  };

  const handleCopyLinkMint = () => {
      if(!capsule) return;
      const url = `${window.location.origin}/capsule/${capsule.shortId}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Copied", description: "Link copied to clipboard." });
  };

  const incrementMint = () => {
    if(!capsule) return;
    const maxLimit = capsule.isPrivate ? 50 : 5;
    const remaining = capsule.maxSupply - capsule.mintedCount;
    if (quantity < maxLimit && quantity < remaining) setQuantity(q => q + 1);
  };

  const decrementMint = () => { if (quantity > 1) setQuantity(q => q - 1); };

  const isSoldOut = capsule && Number(capsule.mintedCount) >= Number(capsule.maxSupply);
  const totalPrice = MINT_PRICE * BigInt(quantity);
  const displayPrice = formatEther(totalPrice);
  const isAuthor = capsule && address && capsule.creator && (address.toLowerCase() === capsule.creator.toLowerCase());
  const canMint = !capsule || !capsule.isPrivate || isAuthor;

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15]">
      <div className="w-full max-w-5xl flex justify-end mb-4"><CustomConnectButton /></div>

      <Header />

      <main className="w-full max-w-4xl flex flex-col items-center mt-4 min-h-[600px] justify-center" ref={containerRef}>

        {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                    <Loader2 className="animate-spin text-blue-500 w-16 h-16 relative z-10" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-wide">Retrieving Capsule</h2>
                    <p className="text-slate-400 font-mono text-sm animate-pulse">{statusMsg}</p>
                </div>
            </div>
        ) : !capsule ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white/5 border border-white/10 rounded-2xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-red-500/10 p-4 rounded-full mb-6 text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]"><Box size={48} /></div>
                <h1 className="text-3xl font-bold text-white mb-2 font-display">Signal Lost</h1>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                    We could not locate this capsule on the Base network. <br/>
                    <span className="text-xs text-slate-500 mt-2 block">(ID: {searchId})</span>
                </p>
                <div className="flex flex-col w-full gap-4">
                    <Button onClick={() => setForceUpdate(prev => prev + 1)} className="bg-blue-600 hover:bg-blue-500 text-white gap-2 w-full h-12">
                        <RefreshCw size={18} /> Retry Deep Scan
                    </Button>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-500">
              <div style={{ width: `${600 * scale}px`, height: `${600 * scale}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
                <div style={{ transform: `scale(${scale})`, transformOrigin: "center center", width: '600px', height: '600px', flexShrink: 0 }}>
                  <RevealedMessage 
                    message={decryptedText} 
                    sealerIdentity={capsule.sealerName} 
                    sealedAt={capsule.createdAt} 
                    revealedAt={capsule.unlockTime} 
                    capsuleId={capsule.shortId} 
                    isRevealed={capsule.isRevealed}
                    isPrivate={capsule.isPrivate}
                    needsPassword={!isDecrypted}
                    onDecrypt={handleDecrypt} 
                    onTimerEnd={handleTimerComplete}
                    isDecrypting={isDecrypting}
                    hasAccess={hasAccess}
                    openConnectModal={openConnectModal}
                    isConnected={isConnected}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full mt-8" style={{ maxWidth: `${600 * scale}px`, position: 'relative', zIndex: 10 }}>
                  <div className="w-full bg-white/5 border border-white/10 rounded-xl backdrop-blur-md overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-3 bg-white/5 border-b border-white/5">
                           <div className="flex items-center gap-2">
                               <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">SUPPLY</span>
                               <span className="text-sm text-white font-mono">{capsule.mintedCount.toString()} / {capsule.maxSupply.toString()}</span>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">UNIT PRICE</span>
                               <span className="text-sm text-white font-mono">0.000777 ETH</span>
                           </div>
                      </div>

                      <div className="p-2 md:p-4 flex items-center gap-2 md:gap-4">
                        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg h-12">
                            <button onClick={decrementMint} disabled={quantity <= 1 || isSoldOut || !canMint} className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"><Minus size={16} /></button>
                            <div className="w-10 text-center font-mono font-bold text-white text-lg">{quantity}</div>
                            <button onClick={incrementMint} disabled={quantity >= (capsule.isPrivate ? 50 : 5) || (Number(capsule.mintedCount) + quantity >= Number(capsule.maxSupply)) || isSoldOut || !canMint} className="w-12 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30"><Plus size={16} /></button>
                        </div>

                        {!isConnected ? <Button onClick={openConnectModal} className="flex-1 bg-slate-800 text-white font-bold h-12 rounded-xl">CONNECT WALLET</Button> 
                        : chain?.id !== APP_CONFIG.ACTIVE_CHAIN.id ? <Button onClick={() => switchChain({ chainId: APP_CONFIG.ACTIVE_CHAIN.id })} className="flex-1 bg-orange-500 text-white font-bold h-12 rounded-xl">SWITCH NETWORK</Button> 
                        : <Button 
                            onClick={handleMint} 
                            disabled={isSoldOut || isWritePending || isConfirming || !canMint} 
                            className={`flex-1 text-sm md:text-lg text-white font-bold h-12 rounded-xl ${capsule.isPrivate ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'} disabled:opacity-50`}
                          >
                            {isConfirming ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> 
                             : isSoldOut ? "SOLD OUT" 
                             : !canMint ? "AUTHOR ONLY"
                             : `MINT ${quantity > 1 ? quantity : ""} (${displayPrice} ETH)`}
                          </Button>}
                      </div>
                      {!canMint && (
                          <div className="bg-red-500/10 border-t border-red-500/20 p-2 text-center">
                              <p className="text-[10px] text-red-400 font-bold tracking-wider">ONLY THE AUTHOR CAN MINT NFTS FOR THIS PRIVATE VAULT.</p>
                          </div>
                      )}
                  </div>

                  {mintSuccessHash && (
                      <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={handleCloseSuccess} // Schließen bei Klick außerhalb + RESET
                      >
                          <Card 
                            className="bg-[#0A0F1E] border border-white/10 w-full max-w-md shadow-2xl relative overflow-hidden"
                            onClick={(e) => e.stopPropagation()} 
                          >
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-gradient-to-b from-blue-500/10 to-transparent blur-3xl"></div>
                              <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-600"></div>

                              {/* FIX 4: Close Button im Popup */}
                              <div className="absolute top-4 right-4 z-50">
                                <Button variant="ghost" size="icon" onClick={handleCloseSuccess} className="hover:bg-white/10 text-slate-400 hover:text-white rounded-full">
                                    <X className="w-5 h-5" />
                                </Button>
                              </div>

                              <CardContent className="p-8 text-center flex flex-col items-center relative z-10">
                                  <div className="relative w-20 h-20 rounded-full border-2 border-blue-500/50 bg-blue-950/30 text-blue-400 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] mb-6">
                                      <Sparkles size={40} strokeWidth={1.5} />
                                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-black p-1.5 rounded-full border border-black shadow-lg">
                                          <CheckCircle2 size={16} strokeWidth={3} />
                                      </div>
                                  </div>

                                  <h3 className="text-2xl font-bold text-white mb-3 font-display">NFT Successfully Minted</h3>
                                  <p className="text-slate-300 mb-8 text-base leading-relaxed">
                                      You now hold a piece of history. This NFT is your proof of ownership.
                                  </p>

                                  <div className="flex gap-3 w-full mb-4">
                                      <Button 
                                        onClick={() => {
                                            const newNft: MintEventData = {
                                                minter: address || "You",
                                                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                                                txHash: mintSuccessHash,
                                                type: 'COPY',
                                                startSerial: 0, 
                                                endSerial: quantity > 1 ? quantity - 1 : 0,
                                                amount: quantity,
                                                blockNumber: 0n,
                                                logIndex: 0
                                            };
                                            setSelectedNft(newNft);
                                        }} 
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold h-12 rounded-xl shadow-lg"
                                      >
                                          VIEW NFT <Eye size={16} className="ml-2"/>
                                      </Button>

                                      <Button 
                                        onClick={() => window.open(`${APP_CONFIG.EXPLORER_URL}/tx/${mintSuccessHash}`, '_blank')} 
                                        className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 h-12 font-bold rounded-xl"
                                      >
                                          PROOF <ExternalLink size={16} className="ml-2"/>
                                      </Button>
                                  </div>

                                  <div className="grid grid-cols-4 gap-2 w-full mb-8">
                                      <Button onClick={handleShareWarpcastMint} className="col-span-2 bg-[#855DCD] hover:bg-[#976fe0] text-white border-0 h-12 rounded-xl flex items-center gap-2" title="Flex on Farcaster">
                                          <SiFarcaster className="w-5 h-5" /> 
                                          <span className="font-bold">Farcaster</span>
                                      </Button>
                                      <Button onClick={handleShareXMint} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 rounded-xl" title="Share on X">
                                          <SiX className="w-5 h-5" />
                                      </Button>
                                      <Button onClick={handleCopyLinkMint} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 rounded-xl" title="Copy Link">
                                          <LinkIcon className="w-5 h-5" />
                                      </Button>
                                  </div>

                                  <div className="pt-6 border-t border-white/5 w-full">
                                      <button onClick={handleCloseSuccess} className="text-xs uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 w-full">
                                          <ArrowLeft size={14} /> Back to Capsule
                                      </button>
                                  </div>
                              </CardContent>
                          </Card>
                      </div>
                  )}
              </div>
            </div>
        )}
      </main>

      {capsule && (
          <div className="w-full mt-16 -mb-20 animate-in slide-in-from-bottom-8 duration-700">
              <MintTable 
                capsuleId={capsule.id} 
                isPrivate={capsule.isPrivate} 
                onRowClick={(nft: MintEventData) => setSelectedNft(nft)}
             />
          </div>
      )}

      <NFTDetailModal 
        nft={selectedNft} 
        capsule={capsule} 
        isOpen={!!selectedNft} 
        onClose={() => setSelectedNft(null)} 
      />

      <Footer />
    </div>
  );
}

export default function CapsulePageWithBoundary() {
  return (
    <ErrorBoundary>
      <CapsuleContent />
    </ErrorBoundary>
  );
}