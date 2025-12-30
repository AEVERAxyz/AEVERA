import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Hourglass, Lock, Unlock, Clock, ExternalLink, Sparkles, Copy, Check, Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { queryClient } from "@/lib/queryClient";

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
  return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function calculateTimeLeft(targetDate: Date) {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

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
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.expired) {
    return null;
  }

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-br from-primary/50 to-accent/50 rounded-xl blur-sm"></div>
        <div className="relative bg-black/80 border border-white/10 rounded-xl px-4 py-3 min-w-[70px] md:min-w-[90px]">
          <span className="text-3xl md:text-5xl font-display font-bold text-white tabular-nums">
            {String(value).padStart(2, '0')}
          </span>
        </div>
      </div>
      <span className="text-xs md:text-sm text-muted-foreground mt-2 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-2xl md:text-4xl text-primary/50 font-light">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-2xl md:text-4xl text-primary/50 font-light">:</span>
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <span className="text-2xl md:text-4xl text-primary/50 font-light">:</span>
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </div>
  );
}

function RevealedMessage({ message, sealerIdentity }: { message: string; sealerIdentity?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Parchment/Scroll Effect */}
      <div className="absolute -inset-2 bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-amber-600/20 rounded-2xl blur-xl"></div>
      <div className="relative parchment-card rounded-2xl p-8 md:p-12 overflow-hidden">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-amber-400/30 rounded-tl-2xl"></div>
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-amber-400/30 rounded-tr-2xl"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-amber-400/30 rounded-bl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-amber-400/30 rounded-br-2xl"></div>
        
        {/* Sparkle decorations */}
        <Sparkles className="absolute top-4 right-4 w-5 h-5 text-amber-400/50 animate-pulse" />
        <Sparkles className="absolute bottom-4 left-4 w-4 h-4 text-amber-400/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Message content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <Unlock className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-amber-100">Message Revealed</h3>
              {sealerIdentity && (
                <p className="text-sm text-amber-200/60" data-testid="text-revealed-sealer">From: {sealerIdentity}</p>
              )}
            </div>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-lg md:text-xl leading-relaxed text-amber-50/90 font-light whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface ZoraMintSectionProps {
  capsule: CapsuleData;
  currentUserAddress: string | null;
  onMintSuccess: () => void;
}

function ZoraMintSection({ capsule, currentUserAddress, onMintSuccess }: ZoraMintSectionProps) {
  const { toast } = useToast();
  const [isMinting, setIsMinting] = useState(false);
  const [showTxInput, setShowTxInput] = useState(false);
  const [txHash, setTxHash] = useState("");

  const isAuthor = currentUserAddress && capsule.sealerAddress 
    ? currentUserAddress.toLowerCase() === capsule.sealerAddress.toLowerCase()
    : false;

  const registerMint = useMutation({
    mutationFn: async (transactionHash: string) => {
      const response = await fetch(`/api/capsules/${capsule.id}/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          transactionHash,
          authorAddress: currentUserAddress,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to register mint");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "NFT Registered!",
        description: "Your capsule has been minted and recorded with provenance.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/capsules', capsule.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/archive'] });
      setShowTxInput(false);
      setTxHash("");
      onMintSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message,
      });
    },
  });

  const handleMintOnZora = async () => {
    if (!isAuthor) {
      toast({
        variant: "destructive",
        title: "Not Authorized",
        description: "Only the capsule author can mint this as an NFT.",
      });
      return;
    }

    setIsMinting(true);
    
    try {
      const provenanceMetadata = {
        name: `TimeCapsule by ${capsule.sealerIdentity || 'Anonymous'}`,
        description: capsule.decryptedContent || "A time-locked message",
        attributes: [
          { trait_type: "Platform", value: "TimeCapsule" },
          { trait_type: "Author", value: capsule.sealerIdentity || "Anonymous" },
          { trait_type: "Sealed At", value: capsule.createdAt },
          { trait_type: "Revealed At", value: capsule.revealDate },
          { trait_type: "Message Hash", value: capsule.messageHash },
          { trait_type: "Capsule ID", value: capsule.id },
        ],
        external_url: `${window.location.origin}/capsule/${capsule.id}`,
      };

      const zoraMintUrl = `https://zora.co/create?` + new URLSearchParams({
        name: provenanceMetadata.name,
        description: provenanceMetadata.description.slice(0, 500),
      }).toString();

      window.open(zoraMintUrl, '_blank');
      setShowTxInput(true);

      toast({
        title: "Minting Started",
        description: "Complete the minting on Zora, then paste the transaction hash below.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Minting Failed",
        description: "Failed to initiate minting. Please try again.",
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleRegisterTx = () => {
    if (!txHash.trim()) {
      toast({
        variant: "destructive",
        title: "Transaction Hash Required",
        description: "Please paste the transaction hash from Zora.",
      });
      return;
    }
    registerMint.mutate(txHash.trim());
  };

  if (capsule.isMinted && capsule.transactionHash) {
    return (
      <div className="pt-6 border-t border-white/10">
        <a
          href={`https://zora.co/collect/base:${capsule.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white"
          data-testid="link-view-nft"
        >
          <ExternalLink className="h-5 w-5" />
          View on Zora
        </a>
        <p className="text-center text-sm text-muted-foreground mt-3">
          This capsule has been minted as an NFT on Base.
        </p>
      </div>
    );
  }

  if (!isAuthor) {
    return (
      <div className="pt-6 border-t border-white/10">
        <div className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-white/10 flex items-center justify-center text-muted-foreground">
          <Sparkles className="mr-2 h-5 w-5 opacity-50" />
          Author-Only Minting
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          Only the capsule author can mint this message as an NFT.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-6 border-t border-white/10 space-y-4">
      {!showTxInput ? (
        <>
          <Button
            onClick={handleMintOnZora}
            disabled={isMinting}
            className="w-full h-14 text-lg font-bold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
            data-testid="button-mint-nft"
          >
            {isMinting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Mint on Zora
              </>
            )}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Mint this message as a limited edition NFT with provenance on Base.
          </p>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-soft-muted text-center">
            Complete minting on Zora, then paste the transaction hash below:
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="bg-black/30 border-white/10 text-soft font-mono text-sm"
              data-testid="input-tx-hash"
            />
            <Button
              onClick={handleRegisterTx}
              disabled={registerMint.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
              data-testid="button-register-mint"
            >
              {registerMint.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Register"
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTxInput(false)}
            className="w-full text-muted-foreground"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

function getCurrentUserAddress(): string | null {
  const storedWallet = localStorage.getItem("wallet_address");
  if (storedWallet) return storedWallet;
  
  const storedUser = localStorage.getItem("farcaster_user");
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser);
      if (userData.verified_addresses?.eth_addresses?.[0]) {
        return userData.verified_addresses.eth_addresses[0];
      }
    } catch (e) {
      console.error("Failed to parse farcaster user", e);
    }
  }
  return null;
}

export default function CapsulePage({ id }: Props) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserAddress(getCurrentUserAddress());
  }, []);

  const { data: capsule, isLoading, error, refetch } = useQuery<CapsuleData>({
    queryKey: ['/api/capsules', id],
    refetchInterval: (query) => {
      // Refetch every 5 seconds if not yet revealed
      const data = query.state.data as CapsuleData | undefined;
      if (data && !data.isRevealed) {
        const revealDate = new Date(data.revealDate);
        const now = new Date();
        // If within 1 minute of reveal, refetch more frequently
        if (revealDate.getTime() - now.getTime() < 60000) {
          return 1000;
        }
        return 5000;
      }
      return false;
    },
  });

  const frameUrl = `${window.location.origin}/frame/${id}`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy manually.",
      });
    }
  };

  const getTimeUntilReveal = () => {
    if (!capsule) return "";
    const revealDate = new Date(capsule.revealDate);
    const now = new Date();
    const diff = revealDate.getTime() - now.getTime();
    if (diff <= 0) return "Now";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const shareOnWarpcast = () => {
    const identity = capsule?.sealerIdentity || "Someone";
    const timeUntil = getTimeUntilReveal();
    const shareText = capsule?.isRevealed
      ? `${identity} sent a message to the future - and it has been revealed! Check it out on TimeCapsule.`
      : `${identity} has sent a message to the future! Reveal in ${timeUntil}. Seal your own prophecy on TimeCapsule.`;
    const text = encodeURIComponent(shareText);
    const url = encodeURIComponent(frameUrl);
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading capsule...</p>
        </div>
      </div>
    );
  }

  if (error || !capsule) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-display font-bold text-white">Capsule Not Found</h1>
          <p className="text-muted-foreground">This time capsule doesn't exist or has been removed.</p>
          <Link href="/">
            <Button variant="outline" className="mt-4" data-testid="button-go-home">
              Create a New Capsule
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const revealDate = new Date(capsule.revealDate);
  const isRevealed = capsule.isRevealed;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px]" />
        {isRevealed && (
          <div className="absolute top-[30%] left-[50%] w-[30%] h-[30%] bg-amber-500/10 rounded-full blur-[100px]" />
        )}
      </div>

      <main className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <Link href="/">
            <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl mb-6 backdrop-blur-sm border border-white/10 ring-1 ring-white/5 shadow-xl cursor-pointer hover:bg-white/10 transition-colors">
              <Hourglass className="w-8 h-8 text-accent animate-pulse" />
            </div>
          </Link>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/50 tracking-tight glow-text">
            TimeCapsule
          </h1>
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="glass-card rounded-3xl p-6 md:p-10 border border-white/10 shadow-2xl relative overflow-hidden neon-container"
        >
          {/* Decorative gradient border effect */}
          <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isRevealed ? 'from-transparent via-amber-400 to-transparent' : 'from-transparent via-primary to-transparent'} opacity-50`}></div>

          {isRevealed ? (
            /* REVEALED STATE */
            <div className="space-y-8">
              <RevealedMessage 
                message={capsule.decryptedContent || "Message could not be decrypted."} 
                sealerIdentity={capsule.sealerIdentity}
              />
              
              {/* NFT Mint Button - Author Only */}
              <ZoraMintSection 
                capsule={capsule} 
                currentUserAddress={currentUserAddress}
                onMintSuccess={() => refetch()}
              />
            </div>
          ) : (
            /* LOCKED STATE */
            <div className="space-y-8">
              {capsule.sealerIdentity && (
                <div className="text-center pb-4 border-b border-white/10">
                  <p className="text-sm text-muted-foreground mb-1">Sealed by</p>
                  <p className="text-lg font-display font-bold text-primary" data-testid="text-sealer-identity">
                    {capsule.sealerIdentity}
                  </p>
                </div>
              )}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6 ring-2 ring-primary/30">
                  <Lock className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
                  Capsule Locked
                </h2>
                <p className="text-muted-foreground">
                  This message is sealed until the reveal time.
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="py-6">
                <CountdownTimer targetDate={revealDate} />
              </div>

              {/* Reveal Date Info */}
              <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent" />
                    Reveals at (UTC):
                  </span>
                  <span className="text-sm font-mono text-accent">
                    {formatUTC(revealDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Share Section */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Share Link</p>
              <div className="flex items-center gap-2 bg-black/60 p-3 rounded-lg border border-white/5">
                <code className="text-sm text-primary flex-1 truncate font-mono" data-testid="text-capsule-url">
                  {frameUrl}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(frameUrl, "Link")}
                  data-testid="button-copy-link"
                >
                  {hasCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={shareOnWarpcast}
                className="w-full"
                data-testid="button-share-warpcast"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Link href="/">
                <Button className="w-full bg-white text-black hover:bg-white/90" data-testid="button-create-new">
                  Create New
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="mt-16 text-center text-sm text-muted-foreground/60 font-mono">
        <p>Built on Base | Farcaster Frame Compatible | Zora Integration</p>
      </footer>
    </div>
  );
}
