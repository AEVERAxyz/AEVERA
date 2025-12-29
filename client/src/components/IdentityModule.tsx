import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, User, Loader2, CheckCircle } from "lucide-react";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export interface Identity {
  type: "wallet" | "farcaster" | "anonymous";
  address?: string;
  displayName: string;
  username?: string;
  fid?: number;
}

interface Props {
  onIdentityChange: (identity: Identity) => void;
  identity: Identity | null;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function IdentityModule({ onIdentityChange, identity }: Props) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkFarcasterFrame();
  }, []);

  const checkFarcasterFrame = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fid = urlParams.get("fid");
    const username = urlParams.get("username");
    
    if (fid && username) {
      onIdentityChange({
        type: "farcaster",
        displayName: `@${username}`,
        username: username,
        fid: parseInt(fid, 10),
      });
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("No wallet found. Install MetaMask or another wallet.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      }) as string[];

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        
        let displayName = shortenAddress(address);
        
        onIdentityChange({
          type: "wallet",
          address: address,
          displayName: displayName,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    onIdentityChange({
      type: "anonymous",
      displayName: "Anonymous",
    });
  };

  if (identity && identity.type !== "anonymous") {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl blur opacity-30"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                {identity.type === "farcaster" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Wallet className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sealing as</p>
                <p className="text-lg font-display font-bold text-white" data-testid="text-identity">
                  {identity.displayName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnectWallet}
                className="text-muted-foreground hover:text-white"
                data-testid="button-disconnect"
              >
                Change
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-20"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center ring-2 ring-white/10">
            <Wallet className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-white mb-2">
            Connect Your Identity
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your wallet to seal the capsule with your identity. This prevents impersonation.
          </p>
          
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-primary to-accent neon-glow"
            data-testid="button-connect-wallet"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </>
            )}
          </Button>

          {error && (
            <p className="mt-4 text-sm text-red-400" data-testid="text-error">
              {error}
            </p>
          )}
          
          <p className="mt-4 text-xs text-muted-foreground/60">
            Using Farcaster? Open this in Warpcast to seal with your @username.
          </p>
        </div>
      </div>
    </div>
  );
}
