import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Props {
  capsuleId: string;
  onReset: () => void;
}

export function SuccessCard({ capsuleId, onReset }: Props) {
  const { toast } = useToast();
  const [hasCopied, setHasCopied] = useState(false);
  
  // Construct the Frame URL
  const frameUrl = `${window.location.origin}/frame/${capsuleId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(frameUrl);
      setHasCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Share this link on Farcaster to let others see your capsule when it opens.",
      });
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please copy the URL manually.",
      });
    }
  };

  const shareOnWarpcast = () => {
    const text = encodeURIComponent("I just created a Time Capsule! 🕰️✨ Check it out:");
    const url = encodeURIComponent(frameUrl);
    window.open(`https://warpcast.com/~/compose?text=${text}&embeds[]=${url}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="glass-card rounded-2xl p-8 text-center space-y-6 max-w-md w-full mx-auto"
    >
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/50">
        <Check className="w-10 h-10 text-green-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-display text-white">Capsule Sealed!</h2>
        <p className="text-muted-foreground">
          Your message has been encrypted and stored safely. It will remain hidden until the reveal date.
        </p>
      </div>

      <div className="bg-black/40 rounded-xl p-4 border border-white/5 space-y-2 text-left">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Capsule Link</p>
        <div className="flex items-center gap-2 bg-black/60 p-3 rounded-lg border border-white/5">
          <code className="text-sm text-primary flex-1 truncate font-mono">
            {frameUrl}
          </code>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 hover:bg-white/10 text-muted-foreground hover:text-white"
            onClick={copyToClipboard}
          >
            {hasCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <Button 
          variant="outline" 
          className="w-full border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={shareOnWarpcast}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        
        <Button 
          className="w-full bg-white text-black hover:bg-white/90"
          onClick={onReset}
        >
          Create Another
        </Button>
      </div>
    </motion.div>
  );
}
