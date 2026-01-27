import { useState, useEffect } from "react";
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { injected } from "wagmi/connectors";
import { Loader2, Lock, ShieldCheck, Globe, Calendar, Eye, EyeOff, AlertTriangle, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";
import { getVerifiedBaseName, getVerifiedEnsName } from "@/lib/utils";
import AeveraVaultABI from "@/abis/AeveraVaultABI.json";
import { v4 as uuidv4 } from 'uuid';
import CryptoJS from 'crypto-js';
import { parseEther } from 'viem';
import { timelockEncrypt, roundAt } from "tlock-js";

// --- CONFIG ---
const CHAIN_HASH = "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971";
const DRAND_URL = "https://api.drand.sh";
const MAX_CHARS = 7777; // Contract Limit

const generateShortId = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Helper: Min Date (Now + 2 Minutes Buffer)
const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 2); 
    return now.toISOString().slice(0, 16);
};

// Base Icon Component
const BaseIcon = ({ className = "" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
        <rect width="24" height="24" rx="5" ry="5" />
    </svg>
);

export default function FrameSeal() {
  // --- STATE ---
  const [message, setMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false); 
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Date Logic
  const [localDateTimeString, setLocalDateTimeString] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Identity Logic
  const [sealerName, setSealerName] = useState("");
  const [resolvedBaseName, setResolvedBaseName] = useState<string | null>(null);
  const [resolvedEnsName, setResolvedEnsName] = useState<string | null>(null);

  // Processing
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("");

  // Contract Data
  const [currentUuid, setCurrentUuid] = useState("");
  const [currentShortId, setCurrentShortId] = useState("");

  // Web3 Hooks
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  // 1. AUTO-CONNECT & INIT
  useEffect(() => {
    if (!isConnected) connect({ connector: injected() });
    setCurrentUuid(uuidv4());
    setCurrentShortId(generateShortId());
  }, [isConnected, connect]);

  // 2. IDENTITY RESOLVER
  useEffect(() => {
    async function fetchIdentities() {
      if (!address) return;
      try {
        const [baseName, ensName] = await Promise.all([
            getVerifiedBaseName(address),
            getVerifiedEnsName(address)
        ]);
        if (baseName) setResolvedBaseName(baseName);
        if (ensName) setResolvedEnsName(ensName);

        if (!sealerName) {
            if (baseName) setSealerName(baseName);
            else if (ensName) setSealerName(ensName);
            else setSealerName(`${address.slice(0, 6)}...${address.slice(-4)}`);
        }
      } catch (e) {
        if (!sealerName) setSealerName(`${address.slice(0, 6)}...${address.slice(-4)}`);
      }
    }
    fetchIdentities();
  }, [address]);

  const getIdentityOptions = () => {
    if (!address) return [];
    const opts = [];
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;

    if (resolvedBaseName) opts.push({ val: resolvedBaseName, label: `🔹 ${resolvedBaseName}` });
    if (resolvedEnsName && resolvedEnsName !== resolvedBaseName) opts.push({ val: resolvedEnsName, label: `🔹 ${resolvedEnsName}` });
    opts.push({ val: short, label: short });

    return opts;
  };

  // 3. DATE CHANGE HANDLER
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalDateTimeString(val);

      if (!val) {
          setSelectedDate(null);
          return;
      }

      const dateObj = new Date(val);
      const now = new Date();
      if (dateObj.getTime() < now.getTime() + 60000) {
          alert("Time must be in the future!");
          setLocalDateTimeString(""); 
          setSelectedDate(null); 
      } else {
          setSelectedDate(dateObj);
      }
  };

  // 4. SEAL HANDLER
  const handleSeal = async () => {
    if (!message || !selectedDate) return;
    if (message.length > MAX_CHARS) return;
    if (isPrivate && !password) return;

    const now = new Date();
    if (selectedDate.getTime() < now.getTime() + 60000) {
        alert("Time must be in the future!");
        return;
    }

    setIsGenerating(true);
    setStatusText("Encrypting...");

    try {
        let finalAuthor = sealerName || "Unknown Wallet";

        let payloadString = message;
        if (isPrivate) {
             setStatusText("Encrypting (AES)...");
             payloadString = CryptoJS.AES.encrypt(message, password).toString();
        }

        setStatusText("Time-Locking...");
        const response = await fetch(`${DRAND_URL}/${CHAIN_HASH}/info`);
        const chainInfo = await response.json();
        const round = roundAt(selectedDate.getTime(), chainInfo);
        const payloadBytes = new TextEncoder().encode(payloadString);

        const safeClient = { chain: () => ({ info: () => Promise.resolve(chainInfo) }) };

        const finalCiphertext = await timelockEncrypt(
            round,
            payloadBytes as any, 
            safeClient as any
        );

        setStatusText("Sign in Wallet...");
        const unlockTimestamp = Math.floor(selectedDate.getTime() / 1000);

        writeContract({
            address: APP_CONFIG.CONTRACT_ADDRESS as `0x${string}`,
            abi: AeveraVaultABI,
            functionName: 'createCapsule',
            args: [
                currentUuid,
                currentShortId,
                finalAuthor,
                BigInt(Number(unlockTimestamp)),
                isPrivate,
                finalCiphertext 
            ],
            value: parseEther("0.000777"),
        });

    } catch (e) {
        console.error(e);
        setIsGenerating(false);
        setStatusText("Error");
        alert("Encryption failed. Please try again.");
    }
  };

  useEffect(() => {
      if (isConfirmed) {
          setIsGenerating(false);
          setStatusText("Sealed!");
          alert(`Success! Capsule #${currentShortId} sealed.`);
          setMessage("");
          setPassword("");
          setCurrentUuid(uuidv4());
          setCurrentShortId(generateShortId());
      }
  }, [isConfirmed]);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-start p-4 font-sans select-none overflow-y-auto">

      {/* CSS Trick für Kalender-Input */}
      <style>{`
          input[type="datetime-local"]::-webkit-calendar-picker-indicator { 
              position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; 
          }
      `}</style>

      {/* --- HEADER --- */}
      <div className="mb-6 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 mt-2">
         <img 
            src="/logo.png" 
            alt="AEVERA" 
            className="h-[60px] w-auto mb-[-6px] drop-shadow-[0_0_15px_rgba(22,82,240,0.5)]" 
         />
         <h1 className="text-3xl font-black text-white tracking-tighter glow-text leading-none mb-0.5">
            AEVERA
         </h1>
         <div className="w-fit border-t border-b border-[#1652F0]/30 py-[2px] mb-[2px] px-2 flex justify-center">
              <span className="text-[#CBD5E1] font-bold text-[0.5rem] tracking-[0.6em] uppercase whitespace-nowrap mr-[-0.6em]">
                BEYOND TIME
              </span>
         </div>
         <p className="text-[0.4rem] text-blue-400 font-medium tracking-[0.3em] uppercase whitespace-nowrap mr-[-0.3em]">
              THE EVERLASTING TRUTH
         </p>
         <p className="mt-2 text-[0.6rem] text-white font-medium italic tracking-wide text-center max-w-[280px] opacity-90 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
            "In a world of vanishing moments, AEVERA is your anchor in time."
         </p>
      </div>

      {/* --- MAIN CARD --- */}
      <div className={cn(
          "w-full max-w-[350px] p-4 rounded-xl border backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-500 mb-8",
          isPrivate 
            ? "bg-purple-950/20 border-purple-500/20 shadow-purple-900/10" 
            : "bg-blue-950/20 border-blue-500/20 shadow-blue-900/10"
      )}>

        <div className={cn(
            "absolute top-0 left-0 w-full h-1 bg-gradient-to-r transition-colors duration-500",
            isPrivate ? "from-purple-400 to-pink-600" : "from-cyan-400 to-blue-600"
        )} />

        {/* 1. TABS */}
        <div className="flex bg-black/40 rounded-lg p-1 mb-3 border border-white/5">
            <button 
                onClick={() => setIsPrivate(false)}
                className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded uppercase tracking-wider transition-all",
                    !isPrivate ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
            >
                <Globe className="w-3 h-3" /> Public Broadcast
            </button>
            <button 
                onClick={() => setIsPrivate(true)}
                className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold rounded uppercase tracking-wider transition-all",
                    isPrivate ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
            >
                <Lock className="w-3 h-3" /> Private Vault
            </button>
        </div>

        {/* 2. INFO BOX */}
        <div className={cn(
            "p-3 rounded-xl border transition-colors duration-500 mb-4",
            isPrivate ? "bg-purple-900/20 border-purple-500/30" : "bg-blue-900/20 border-blue-500/30"
        )}>
             <h3 className={cn("font-bold flex items-center gap-1.5 text-[11px]", isPrivate ? "text-purple-400" : "text-blue-400")}>
                {isPrivate ? <Lock size={12}/> : <Globe size={12}/>}
                {isPrivate ? "Private Vault" : "Public Broadcast"}
             </h3>
             <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">
                {isPrivate 
                    ? "Password Protected & Time-Locked. Double Layer Security. Absolute Privacy."
                    : "Time-Locked. Once revealed, anyone can read it. A legacy for the world."
                }
             </p>
             <div className="mt-2 text-[8px] font-mono opacity-70 border-t border-white/10 pt-1.5 uppercase tracking-wide flex flex-wrap gap-1.5 text-slate-400">
                <span className="text-white">Sealing is Minting (0.000777 ETH)</span>
                <span>|</span>
                <span>{isPrivate ? "Only you can mint copies of it" : "Anyone can mint copies of it"}</span>
                <span>|</span>
                <span>{isPrivate ? "Supply 1000" : "Supply 100"}</span>
             </div>
        </div>

        {/* 3. IDENTITY SELECTOR */}
        <div className="mb-3 relative group z-20">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10">
                <UserCircle2 className="w-4 h-4" />
            </div>
            <Select value={sealerName} onValueChange={setSealerName}>
                <SelectTrigger className="w-full h-10 bg-black/30 border-white/10 text-[11px] font-mono text-white pl-10 pr-3 flex items-center justify-between">
                    <span className="opacity-60 uppercase text-[9px] font-sans font-bold">Origin Identity:</span>
                    <SelectValue placeholder="Select Identity" />
                </SelectTrigger>
                <SelectContent className="bg-[#0A0F1E] border-white/10 text-white text-xs z-50">
                    {getIdentityOptions().map((opt) => (
                        <SelectItem key={opt.val} value={opt.val} className="focus:bg-white/10 cursor-pointer font-mono text-[10px]">
                            {opt.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {/* 4. DATE SELECTOR (FINAL FIX: PADDING & ALIGNMENT) */}
        <div className="mb-3 relative group z-10 w-full h-10">

            {/* Label - Links verankert */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="text-[9px] font-sans font-bold text-white opacity-60 uppercase whitespace-nowrap">
                    The Era of Reveal:
                </span>
            </div>

            {/* Input - Rechts ausgerichtet via Padding */}
            <input
                type="datetime-local"
                min={getMinDateTime()}
                value={localDateTimeString}
                onChange={handleDateChange}
                // FIX: pr-7 (statt pr-3) schiebt das Datum etwas nach links, weg vom Rand.
                className="w-full h-full bg-black/30 border border-white/10 rounded-md text-right pr-7 pl-[130px] text-[11px] font-medium text-white font-mono cursor-pointer focus:outline-none focus:border-white/20"
                style={{ colorScheme: 'dark' }} 
            />
        </div>

        {/* 5. MESSAGE INPUT */}
        <div className="mb-3 flex-1">
          <Textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isPrivate ? "Write your private message for the Beyond..." : "Write your public message for the Beyond..."}
            className="w-full bg-[#020617]/50 border-white/10 rounded-lg p-3 text-[11px] text-slate-200 focus:border-white/20 h-32 resize-none placeholder:text-slate-600 font-normal leading-relaxed shadow-inner"
          />
          <div className={cn(
              "text-[9px] text-right mt-1.5 font-mono transition-colors",
              message.length > MAX_CHARS ? "text-red-400 font-bold" : "text-slate-500"
          )}>
             {message.length} / {MAX_CHARS} Chars
          </div>
        </div>

        {/* 6. PASSWORD INPUT */}
        {isPrivate && (
            <div className="mb-4 space-y-1 animate-in fade-in slide-in-from-top-2">
                <div className="relative group">
                    <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Decryption Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-purple-900/10 border-purple-500/30 text-white pr-9 text-xs h-10 focus:border-purple-500 transition-colors placeholder:text-purple-300/50"
                    />
                    <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-red-400 pl-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>No recovery if lost.</span>
                </div>
            </div>
        )}

        {/* ACTION BUTTON */}
        <Button 
          onClick={handleSeal}
          disabled={isGenerating || isPending || !message || !selectedDate || message.length > MAX_CHARS || (isPrivate && !password)}
          className={cn(
            "w-full h-12 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 border border-t-white/10 border-b-black/50 shadow-lg mt-1",
            isPrivate 
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-500/20" 
                : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/20"
          )}
        >
          {isGenerating || isPending ? (
            <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{statusText || "Processing..."}</span>
            </div>
          ) : (
            <span>Seal for the Beyond (0.000777 ETH)</span>
          )}
        </Button>

      </div>

      {/* --- FOOTER --- */}
      <div className="mb-8 flex flex-col items-center gap-3">
         <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-2 shadow-lg relative overflow-hidden">
             <BaseIcon className="w-3.5 h-3.5 text-[#0052FF]" />
             <span className="text-[9px] font-semibold text-slate-300 tracking-wide">
                Secured on Base <span className="mx-1 text-slate-600">|</span> Built by <span className="text-white">gelassen.eth</span>
             </span>
         </div>
      </div>
    </div>
  );
}