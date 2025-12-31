import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Capsule {
  id: string;
  isRevealed: boolean;
  zoraUrl?: string;
  sealerIdentity?: string;
}

interface Props {
  capsule: Capsule;
}

export function ZoraMintButton({ capsule }: Props) {
  const handleMint = () => {
     if (capsule.zoraUrl) {
         window.open(capsule.zoraUrl, '_blank');
     } else {
         // Fallback, falls noch keine URL da ist
         alert("Minting is enabled after the capsule is revealed on Zora.");
     }
  };

  return (
    <div className="w-full space-y-2 pt-4 border-t border-white/5">
        <Button 
          className="w-full h-12 bg-[#855DCD] hover:bg-[#855DCD]/90 text-white font-bold rounded-xl gap-2 shadow-[0_0_20px_rgba(133,93,205,0.4)] transition-all hover:scale-[1.02]"
          onClick={handleMint}
        >
          <Sparkles className="w-5 h-5" /> Mint on Zora
        </Button>
        <p className="text-[10px] text-center text-slate-500">
            Only the capsule author can mint this message as an NFT.
        </p>
    </div>
  );
}