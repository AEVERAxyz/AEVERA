import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'; 
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Loader2, Globe, Lock, Eye, EyeOff, AlertTriangle, Upload, UserCircle2, Calendar, ArrowRight, CheckCircle, ShieldCheck, Link as LinkIcon, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArchiveTable } from "@/components/ArchiveTable";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { parseEther } from 'viem';

// --- OFFICIAL BRAND ICONS (REACT-ICONS) ---
import { SiFarcaster, SiX } from "react-icons/si";

// --- DRAND TIMELOCK LIBRARY ---
import { timelockEncrypt, roundAt } from "tlock-js";

// --- ABI IMPORTS ---
import AeveraGatewayABI from "../abis/AeveraGateway.json";

// --- CONFIG & UTILS IMPORTIEREN ---
import { APP_CONFIG } from "../lib/config";
import { getVerifiedBaseName, getVerifiedEnsName, GATEWAY_ADDRESS } from "../lib/utils";

// --- DRAND CONFIGURATION ---
const CHAIN_HASH = "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";
const DRAND_URL = "https://api.drand.sh";

// --- DATE HELPER ---
function formatUTC(date: Date): string {
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';
}

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function Home() {
  // --- STATE ---
  const [message, setMessage] = useState("");
  const [sealerName, setSealerName] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [localDateTimeString, setLocalDateTimeString] = useState("");

  const [mode, setMode] = useState<"public" | "private">("public");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("");

  const [successData, setSuccessData] = useState<{uuid: string, shortId: string, txHash: string} | null>(null);
  const [archiveRefreshTrigger, setArchiveRefreshTrigger] = useState(0);

  const [currentUuid, setCurrentUuid] = useState("");
  const [currentShortId, setCurrentShortId] = useState("");

  // --- IDENTITY STATES ---
  const [resolvedBaseName, setResolvedBaseName] = useState<string | null>(null);
  const [resolvedEnsName, setResolvedEnsName] = useState<string | null>(null);

  // WEB3 HOOKS
  const { isConnected, address, chain } = useAccount(); 
  const { openConnectModal } = useConnectModal();
  const { switchChain } = useSwitchChain(); 

  // --- IDENTITY RESOLVER ---
  useEffect(() => {
    async function fetchIdentities() {
      if (!address) {
        setResolvedBaseName(null);
        setResolvedEnsName(null);
        return;
      }
      try {
        const [baseName, ensName] = await Promise.all([
            getVerifiedBaseName(address),
            getVerifiedEnsName(address)
        ]);
        if (baseName) setResolvedBaseName(baseName);
        if (ensName) setResolvedEnsName(ensName);
      } catch (e) {
        console.error("Identity Fetch Error:", e);
      }
    }
    fetchIdentities();
  }, [isConnected, address]);

  // Wallet Actions
  const { writeContract, data: hash, isPending, reset: resetWagmi } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const { toast } = useToast();

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getAvailableIdentities = () => {
    if (!address) return [];
    const options = [];
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

    if (resolvedBaseName) {
        options.push({ value: resolvedBaseName, label: `🔵 ${resolvedBaseName} (Base)` });
    }
    if (resolvedEnsName && resolvedEnsName !== resolvedBaseName) {
        options.push({ value: resolvedEnsName, label: `🌐 ${resolvedEnsName} (ENS)` });
    }
    options.push({ value: shortAddr, label: `👤 ${shortAddr} (Wallet)` });
    return options;
  };

  useEffect(() => {
    if (isConnected && address) {
        const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
        if (resolvedBaseName) {
            setSealerName(resolvedBaseName);
        }
        else if (resolvedEnsName) {
            setSealerName(resolvedEnsName);
        }
        else if (!sealerName) setSealerName(shortAddr);
    } else {
        setSealerName("");
    }
  }, [isConnected, address, resolvedEnsName, resolvedBaseName]);

  useEffect(() => {
    setCurrentUuid(uuidv4());
    setCurrentShortId(generateShortId());
  }, []);

  // --- SEAL HANDLER (UPDATED WITH BACKEND SIGNATURE) ---
  const handleSeal = async () => {
    if (!message || !selectedDate) {
      toast({ title: "Incomplete", description: "Please fill out message and date.", variant: "destructive" });
      return;
    }

    let finalAuthor = sealerName;
    if ((!finalAuthor || finalAuthor === "") && address) {
        finalAuthor = `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    if (!finalAuthor) finalAuthor = "Unknown Wallet";
    setSealerName(finalAuthor);

    const now = Date.now();
    if (selectedDate.getTime() < now + 60000) {
        toast({ title: "Invalid Time", description: "Reveal time must be at least 1 min in the future.", variant: "destructive" });
        return;
    }

    if (mode === "private" && !password) {
      toast({ title: "Password Required", description: "Private capsules need a password.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setStatusText("Preparing Encryption...");

    try {
      let payloadString = message;

      if (mode === "private") {
          setStatusText("Applying Layer 1: AES Encryption...");
          payloadString = CryptoJS.AES.encrypt(message, password).toString();
      }

      setStatusText("Applying Layer 2: Time-Lock...");

      const response = await fetch(`${DRAND_URL}/${CHAIN_HASH}/info`);
      if (!response.ok) throw new Error("Failed to fetch Drand Chain Info");
      const chainInfo = await response.json();

      const round = roundAt(selectedDate.getTime(), chainInfo);
      const payloadBytes = new TextEncoder().encode(payloadString);

      const safeClient = {
          chain: () => ({ info: () => Promise.resolve(chainInfo) })
      };

      const finalCiphertext = await timelockEncrypt(
        round,
        payloadBytes as any, 
        safeClient as any
      );

      // --- NEU: VERIFY IDENTITY & SIGN (Backend Call) ---
      setStatusText("Verifying Identity...");

      let signature = "0x"; 

      try {
        const signResponse = await fetch('/api/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userAddress: address, 
                authorName: finalAuthor 
            })
        });

        if (!signResponse.ok) {
            throw new Error("Identity Verification failed");
        }

        const signData = await signResponse.json();
        signature = signData.signature;

      } catch (signError) {
          console.error("Signature Error:", signError);
          toast({ title: "Verification Failed", description: "Could not verify identity.", variant: "destructive" });
          setIsGenerating(false);
          return; // STOP HERE
      }
      // --------------------------------------------------

      setStatusText("Anchoring to Blockchain...");

      const unlockTimestamp = Math.floor(selectedDate.getTime() / 1000);
      const isPrivateBool = mode === "private";

      writeContract({
        address: GATEWAY_ADDRESS as `0x${string}`,
        abi: AeveraGatewayABI,
        functionName: 'engrave',
        args: [
            address,
            {
                uuid: currentUuid,
                shortId: currentShortId,
                author: finalAuthor,
                content: `0x${Buffer.from(finalCiphertext as string).toString('hex')}`,
                unlockTime: BigInt(Number(unlockTimestamp)),
                isPrivate: isPrivateBool
            },
            false,
            signature // <--- NEU: Die Unterschrift vom Backend!
        ],
        value: parseEther("0.000777"),
      }, {
        onError: (error) => {
            console.error("WriteContract Error:", error);
            toast({ title: "Wallet Error", description: error.message || "Transaction rejected", variant: "destructive" });
            setIsGenerating(false);
        }
      });

    } catch (e: any) {
      console.error("Encryption/Seal Error:", e);
      let displayError = e.message || "Encryption failed";
      if (displayError.includes("fetch")) displayError = "Network Connection Failed";

      toast({ title: "Encryption Error", description: displayError, variant: "destructive" });
      setIsGenerating(false);
      setStatusText("");
    }
  };

  useEffect(() => {
    if (isConfirmed && hash) {
      setSuccessData({
          uuid: currentUuid,
          shortId: currentShortId,
          txHash: hash
      });
      setIsGenerating(false);
      setStatusText("");
      setArchiveRefreshTrigger(prev => prev + 1);
      toast({ title: "Eternalized!", description: "Message anchored on-chain forever.", className: "bg-green-600 text-white" });
    }
  }, [isConfirmed, hash, currentUuid, currentShortId, toast]);

  const resetForm = () => {
      resetWagmi();
      setMessage("");
      setPassword("");
      setLocalDateTimeString("");
      setSelectedDate(null);
      setCurrentUuid(uuidv4());
      setCurrentShortId(generateShortId());
      setSuccessData(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getShareText = (platform: 'x' | 'farcaster') => {
      if(!successData) return "";

      const capsuleUrl = `${window.location.origin}/capsule/${successData.shortId}`;
      const homeUrl = window.location.origin;
      const baseHandle = '@base';
      const appHandle = platform === 'farcaster' ? '@aevera' : '@AEVERAxyz';

      if (mode === 'private') {
          // FIX: Ersetze kaputtes Zeichen durch Schloss-Emoji 🔒
          return `I just secured a Private Vault on ${appHandle}. 🔒\n\nVerified. Eternal. Secured on ${baseHandle}. #AEVERA\n\nView my vault: ${capsuleUrl}\nSeal your own legacy: ${homeUrl}`;
      } else {
          // FIX: Ersetze kaputtes Zeichen durch Sanduhr-Emoji ⏳
          return `I just anchored a message in time on ${appHandle}. ⏳\n\nVerified. Eternal. Secured on ${baseHandle}. #AEVERA\n\nMint my legacy as NFT: ${capsuleUrl}\nSeal your own legacy: ${homeUrl}`;
      }
  };

  const handleShareWarpcast = () => {
      if(!successData) return;
      const text = getShareText('farcaster');
      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank');
  };

  const handleShareX = () => {
      if(!successData) return;
      const text = getShareText('x');
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(shareUrl, '_blank');
  };

  const handleCopyLink = () => {
      if(!successData) return;
      const url = `${window.location.origin}/capsule/${successData.shortId}`;
      navigator.clipboard.writeText(url);
      toast({ title: "Copied", description: "Capsule link copied to clipboard." });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] relative overflow-x-hidden font-sans selection:bg-blue-500/30">

       <style>{`
          .archive-table-container table { border-collapse: separate; border-spacing: 0; width: 100%; }
          .archive-table-container th { position: sticky; top: 0; z-index: 10; background-color: #0d121f; border-bottom: 1px solid rgba(255,255,255,0.1); }
          input[type="datetime-local"]::-webkit-calendar-picker-indicator { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
       `}</style>

       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#1652F0]/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-5xl flex justify-end mb-4 relative z-50">
         <CustomConnectButton />
      </div>

      <Header />

      <main className="w-full max-w-3xl px-4 flex flex-col gap-8 relative z-10">

        {/* --- FORMULAR (IMMER SICHTBAR) --- */}
        <Tabs defaultValue="public" onValueChange={(v) => setMode(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6 p-1 rounded-xl">
                <TabsTrigger value="public" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
                <Globe className="w-4 h-4 mr-2" /> Public Broadcast
                </TabsTrigger>
                <TabsTrigger value="private" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg transition-all duration-300">
                <Lock className="w-4 h-4 mr-2" /> Private Vault
                </TabsTrigger>
            </TabsList>

            <Card className="bg-white/5 border-white/10 relative overflow-hidden backdrop-blur-sm shadow-2xl md:min-h-[600px] flex flex-col">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r transition-colors duration-500 ${mode === 'public' ? 'from-cyan-400 to-blue-600' : 'from-purple-400 to-pink-600'}`}></div>

                <CardContent className="space-y-6 pt-8 flex-1 flex flex-col">
                <div className={`p-4 rounded-xl border transition-colors duration-500 ${mode === 'public' ? 'bg-blue-900/20 border-blue-500/30' : 'bg-purple-900/20 border-purple-500/30'}`}>
                    <h3 className={`font-bold flex items-center gap-2 text-lg ${mode === 'public' ? 'text-blue-400' : 'text-purple-400'}`}>
                    {mode === 'public' ? <Globe size={20}/> : <Lock size={20}/>}
                    {mode === 'public' ? "Public Broadcast" : "Private Vault"}
                    </h3>
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                    {mode === 'public'
                        ? "Time-Locked. Once revealed, anyone can read it. A legacy for the world."
                        : "Password Protected & Time-Locked. Double Layer Security. Absolute Privacy."}
                    </p>
                    <div className="mt-3 text-[10px] font-mono opacity-80 border-t border-white/10 pt-2 uppercase tracking-wide flex flex-wrap gap-2 text-slate-400">
                    <span className="text-white">Sealing is Minting (0.000777 ETH)</span>
                    <span>|</span>
                    <span>{mode === 'public' ? "Anyone can mint copies of it" : "Only you can mint copies of it"}</span>
                    <span>|</span>
                    <span>{mode === 'public' ? "Supply 100" : "Supply 1000"}</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wider text-slate-400">Origin Identity (Post as)</Label>
                        <div className="relative">
                        {isConnected ? (
                            <Select value={sealerName} onValueChange={setSealerName}>
                                <SelectTrigger className="bg-black/40 border-white/10 h-12 text-white">
                                <div className="flex items-center gap-2">
                                    <UserCircle2 size={18} className="text-slate-400" />
                                    <SelectValue placeholder="Select Identity" />
                                </div>
                                </SelectTrigger>
                                <SelectContent className="bg-[#050A15] border-white/10 text-white z-50">
                                {getAvailableIdentities().map((id) => (
                                    <SelectItem key={id.value} value={id.value}>{id.value === id.label ? id.label : id.label}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="bg-black/40 border border-white/10 h-12 flex items-center px-4 rounded-md text-slate-500 text-sm">
                                Connect Wallet to select identity
                            </div>
                        )}
                        </div>
                    </div>

                    <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wider text-slate-400">The Era of Reveal (Local)</Label>
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white pointer-events-none z-10">
                            <Calendar size={18} />
                        </div>
                        <Input
                            type="datetime-local"
                            min={getMinDateTime()}
                            className="bg-black/40 border-white/10 h-12 pl-10 text-white relative z-0"
                            value={localDateTimeString}
                            onChange={(e) => {
                                setLocalDateTimeString(e.target.value);
                                if(e.target.value) {
                                    setSelectedDate(new Date(e.target.value));
                                } else {
                                    setSelectedDate(null);
                                }
                            }}
                        />
                    </div>
                    {selectedDate && !isNaN(selectedDate.getTime()) && (
                        <div className="text-[11px] text-blue-300 mt-1 flex items-center gap-1.5 pl-1 animate-in fade-in slide-in-from-top-1">
                            <Globe size={12} />
                            <span>Global Reveal Time: <strong>{formatUTC(selectedDate)}</strong></span>
                        </div>
                    )}
                    </div>
                </div>

                <div className="space-y-2 flex-1 flex flex-col">
                    <Label className="text-xs uppercase tracking-wider text-slate-400">Write your message for the Beyond</Label>
                    <Textarea
                    placeholder={mode === 'public' ? "Write your public message here..." : "Write your private message here..."}
                    className="bg-black/40 border-white/10 min-h-[250px] flex-1 resize-none p-4 font-light leading-relaxed text-lg focus:border-blue-500/50 transition-all"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    />
                    <div className="text-xs text-slate-500 text-right">
                        {message.length} / 7777 Chars (Max On-Chain Limit)
                    </div>
                </div>

                {mode === 'private' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 p-4 border border-purple-500/20 bg-purple-900/10 rounded-xl">
                    <Label className="text-purple-300 flex items-center gap-2 text-xs uppercase tracking-wider">Decryption Password (Required)</Label>
                    <div className="relative group">
                        <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Set a strong secret key..."
                        className="bg-black/40 border-purple-500/30 text-white pr-10 focus:border-purple-500 transition-colors h-12 font-mono"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    <p className="text-xs text-red-400 flex items-center gap-1.5 mt-2">
                        <AlertTriangle size={12}/> Ensure you save this password. No recovery possible.
                    </p>
                    </div>
                )}
                </CardContent>

                <CardFooter className="pb-8 pt-2 flex gap-3">
                {!isConnected ? (
                    <Button onClick={openConnectModal} className="flex-1 h-14 text-lg font-bold bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
                    Connect Wallet to Seal
                    </Button>
                ) : chain?.id !== APP_CONFIG.ACTIVE_CHAIN.id ? (
                    <Button 
                        onClick={() => switchChain({ chainId: APP_CONFIG.ACTIVE_CHAIN.id })} 
                        className="flex-1 h-14 text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all shadow-lg shadow-orange-500/20"
                    >
                        Switch to {APP_CONFIG.ACTIVE_CHAIN.name}
                    </Button>
                ) : (
                    <Button
                    onClick={handleSeal}
                    disabled={isGenerating || isPending || isConfirming || !message || !sealerName || !selectedDate || message.length > 7777}
                    className={`flex-1 h-14 w-full text-sm md:text-lg font-bold rounded-xl transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 ${mode === 'public' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/20' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20'}`}
                    >
                    {isGenerating ? <><Loader2 className="animate-spin mr-2"/> {statusText}</> :
                        isPending ? <><Loader2 className="animate-spin mr-2"/> Confirm in Wallet...</> :
                        isConfirming ? <><Loader2 className="animate-spin mr-2"/> Sealing on Base...</> :
                        <>Seal for the Beyond (0.000777 ETH)</>}
                    </Button>
                )}
                </CardFooter>
            </Card>
        </Tabs>
      </main>

      {/* --- SUCCESS MODAL POPUP --- */}
      {successData && (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={resetForm}
        >
            <Card 
                className="w-full max-w-lg bg-[#0A0F1E] border border-white/10 overflow-hidden shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* CLOSE BUTTON */}
                <div className="absolute top-4 right-4 z-50">
                    <Button variant="ghost" size="icon" onClick={resetForm} className="hover:bg-white/10 text-slate-400 hover:text-white rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-gradient-to-b ${mode === 'private' ? 'from-purple-500/10' : 'from-blue-500/10'} to-transparent blur-3xl`}></div>
                <div className={`h-1.5 w-full bg-gradient-to-r ${mode === 'private' ? 'from-purple-600 via-pink-500 to-purple-600' : 'from-blue-500 via-cyan-400 to-blue-600'}`}></div>

                <CardContent className="pt-16 pb-12 text-center flex flex-col items-center relative z-10">
                    <div className="mb-8 relative">
                        <div className={`absolute inset-0 ${mode === 'private' ? 'bg-purple-500/20' : 'bg-blue-500/20'} blur-2xl rounded-full`}></div>
                        <div className={`relative w-24 h-24 rounded-full border-2 ${mode === 'private' ? 'border-purple-500/50 bg-purple-950/30 text-purple-400' : 'border-blue-500/50 bg-blue-950/30 text-blue-400'} flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                            {mode === 'private' ? <ShieldCheck size={48} strokeWidth={1.5} /> : <Globe size={48} strokeWidth={1.5} />}
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-black p-1.5 rounded-full border border-black shadow-lg">
                                <CheckCircle size={16} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-3 tracking-tight font-display">
                        Capsule Sealed & Secured.
                    </h2>

                    <p className="text-slate-300 max-w-sm mx-auto mb-10 text-base font-light leading-relaxed">
                        Your message has been encrypted and anchored on the Base blockchain. It is now beyond time.
                    </p>

                    <div className="flex flex-col w-full max-w-sm gap-4">
                        <div className="flex gap-3 w-full">
                            <Button
                                onClick={() => window.location.href = `/capsule/${successData.shortId}`}
                                className={`flex-1 h-12 font-bold bg-gradient-to-r ${mode === 'private' ? 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20' : 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/20'} text-white rounded-xl shadow-lg transition-all hover:scale-[1.02]`}
                            >
                                VIEW CAPSULE <ArrowRight size={16} className="ml-2" />
                            </Button>

                            <Button 
                                onClick={() => window.open(`${APP_CONFIG.EXPLORER_URL}/tx/${successData.txHash}`, '_blank')} 
                                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl font-bold transition-all"
                                title="View Transaction Proof"
                            >
                                PROOF <ExternalLink size={16} className="ml-2"/>
                            </Button>
                        </div>

                        <div className="grid grid-cols-4 gap-2 w-full">
                            <Button onClick={handleShareWarpcast} className="col-span-2 bg-[#855DCD] hover:bg-[#976fe0] text-white border-0 h-12 rounded-xl flex items-center gap-2" title="Share on Farcaster">
                                <SiFarcaster className="w-5 h-5" /> 
                                <span className="font-bold">Farcaster</span>
                            </Button>
                            <Button onClick={handleShareX} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 rounded-xl" title="Share on X">
                                <SiX className="w-5 h-5" />
                            </Button>
                            <Button onClick={handleCopyLink} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 h-12 rounded-xl" title="Copy Link">
                                <LinkIcon className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 w-full max-w-xs mx-auto">
                        <button onClick={resetForm} className="text-xs uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors flex items-center justify-center gap-2 w-full">
                            <Upload size={14} /> Seal another Message
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      <div className="w-full mt-16 -mb-20">
        <ArchiveTable key={archiveRefreshTrigger} />
      </div>

      <Footer />
    </div>
  );
}