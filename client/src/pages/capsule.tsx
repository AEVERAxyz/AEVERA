import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Unlock, Copy } from "lucide-react";
import { SiFarcaster } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { ZoraMintButton } from "@/components/ZoraMintButton";

interface Capsule {
  id: string;
  encryptedContent: string;
  decryptionKey: string;
  revealDate: string;
  createdAt: string;
  isRevealed: boolean;
  sealerIdentity?: string;
  sealerType?: string;
  sealerAddress?: string;
  zoraUrl?: string;
  messageHash: string;
}

function formatTimeLeft(targetDate: Date) {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

// HIER WAR DIE ÄNDERUNG: "default" hinzugefügt
export default function CapsulePage() {
  const [, params] = useRoute("/capsule/:id");
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);

  const { data: capsule, isLoading, error } = useQuery<Capsule>({
    queryKey: [`/api/capsules/${params?.id}`],
    enabled: !!params?.id,
    refetchInterval: (data) => {
        if (!data) return 5000;
        return data.isRevealed ? false : 1000;
    }
  });

  useEffect(() => {
    if (!capsule) return;

    const timer = setInterval(() => {
      const target = new Date(capsule.revealDate);
      const left = formatTimeLeft(target);
      setTimeLeft(left);
    }, 1000);

    return () => clearInterval(timer);
  }, [capsule]);

  const handleDecrypt = async () => {
    if (!capsule || !capsule.isRevealed) return;

    try {
        const response = await fetch(`/api/capsules/${capsule.id}/decrypt`);
        if(response.ok) {
            const data = await response.json();
            setDecryptedMessage(data.message);
        }
    } catch(e) {
        console.error("Decryption failed", e);
    }
  };

  useEffect(() => {
      if(capsule?.isRevealed) {
          handleDecrypt();
      }
  }, [capsule?.isRevealed]);

  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Link copied to clipboard" });
  };

  const shareOnWarpcast = () => {
    const link = window.location.href;
    const text = capsule?.isRevealed 
        ? "This TimeCapsule has been revealed! Witness the message from the past. 🔓✨"
        : "I'm waiting for this TimeCapsule to open. ⏳🔒";
    const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(link)}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-blue-400">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="animate-pulse">Retrieving Capsule from the chain...</p>
      </div>
    );
  }

  if (error || !capsule) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-400 mb-2">Capsule Not Found</h2>
        <p className="text-slate-400 mb-6">This capsule might have been lost in time.</p>
        <Button onClick={() => window.location.href = "/"} variant="outline">Return Home</Button>
      </div>
    );
  }

  const isLocked = !capsule.isRevealed;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30 flex flex-col">
      {/* Header */}
      <div className="pt-12 pb-6 text-center relative z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="flex flex-col items-center gap-2 mb-2">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white glow-text">TimeCapsule</h1>
            <p className="text-blue-200/80 uppercase tracking-[0.2em] text-xs font-medium">Send a message to the future</p>
            <p className="text-[#3B82F6] uppercase tracking-[0.1em] text-[10px] font-bold animate-pulse">Mint it as an NFT when revealed</p>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 pb-12 flex-1 relative z-10">
        <div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${isLocked ? 'from-blue-600 to-purple-600' : 'from-green-400 to-emerald-600'} rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000`}></div>

            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl">
                <div className="flex flex-col items-center text-center gap-6">

                    {/* Icon Status */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center ring-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${isLocked ? 'bg-blue-900/20 ring-blue-500/50 text-blue-400' : 'bg-green-900/20 ring-green-500/50 text-green-400'}`}>
                    {isLocked ? <Lock className="w-8 h-8" /> : <Unlock className="w-8 h-8" />}
                    </div>

                    <div className="space-y-2">
                    <h2 className="text-3xl font-display font-bold text-white glow-text">
                        {isLocked ? "Capsule Locked" : "Message Revealed"}
                    </h2>
                    </div>

                    {/* Content Area */}
                    <div className="w-full bg-black/40 rounded-2xl p-6 border border-white/5 min-h-[120px] flex items-center justify-center relative overflow-hidden">
                        {isLocked ? (
                            <div className="grid grid-cols-4 gap-4 w-full max-w-sm">
                                {[
                                    { label: "DAYS", val: timeLeft?.days ?? 0 },
                                    { label: "HOURS", val: timeLeft?.hours ?? 0 },
                                    { label: "MINS", val: timeLeft?.minutes ?? 0 },
                                    { label: "SECS", val: timeLeft?.seconds ?? 0 }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="text-2xl md:text-3xl font-mono font-bold text-white tabular-nums drop-shadow-md">
                                            {String(item.val).padStart(2, '0')}
                                        </div>
                                        <div className="text-[10px] uppercase tracking-widest text-blue-400/70 font-medium mt-1">
                                            {item.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full text-left space-y-4">
                                <div className="text-xs text-slate-500 italic mb-2 pb-2 border-b border-white/5">
                                    {capsule.sealerIdentity} wrote on {new Date(capsule.createdAt).toLocaleString()} for {new Date(capsule.revealDate).toLocaleString()}:
                                </div>
                                {decryptedMessage ? (
                                    <p className="text-lg md:text-xl text-white font-serif leading-relaxed whitespace-pre-wrap animate-in fade-in duration-1000">
                                        {decryptedMessage}
                                    </p>
                                ) : (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reveal Info */}
                    {isLocked && (
                        <div className="flex items-center justify-between w-full text-xs text-slate-500 border-t border-white/5 pt-4">
                            <span>Reveals at:</span>
                            <span className="text-blue-400 font-mono">{new Date(capsule.revealDate).toLocaleString(undefined, {timeZoneName: 'short'})}</span>
                        </div>
                    )}

                    {/* Mint Button */}
                    {!isLocked && <ZoraMintButton capsule={capsule} />}

                    {/* Link Box */}
                    <div className="flex items-center gap-2 w-full bg-black/30 p-1 rounded-xl border border-white/10">
                        <div className="flex-1 px-3 text-xs text-slate-500 font-mono truncate">
                            {window.location.href}
                        </div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={copyLink}>
                            <Copy className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button variant="outline" onClick={shareOnWarpcast} className="border-white/10 hover:bg-white/5 text-slate-300 gap-2">
                            <SiFarcaster className="w-4 h-4 text-purple-400" /> Share on Warpcast
                        </Button>

                        <Button variant="secondary" onClick={() => window.location.href = "/"} className="bg-white text-black hover:bg-slate-200">
                            Create New
                        </Button>
                    </div>

                </div>
            </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-white/5 mt-auto">
          <div className="flex justify-center items-center gap-6 text-[10px] tracking-widest text-slate-600 uppercase font-medium mb-4">
            <span>Powered by</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-[#0052FF]"></span> Base</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-[#855DCD]"></span> Farcaster</span>
            <span className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-white"></span> Zora</span>
          </div>
          <div className="text-slate-600 text-xs">
            created by gelassen.eth
          </div>
      </footer>
    </div>
  );
}