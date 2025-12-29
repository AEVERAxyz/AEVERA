import { useState, useEffect } from "react";
import { NeynarAuthButton, useNeynarContext } from "@neynar/react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, CheckCircle, ChevronDown } from "lucide-react";

export interface Identity {
  type: "farcaster";
  displayName: string;
  username?: string;
  fid?: number;
  address?: string;
  verifications?: string[];
}

interface Props {
  onIdentityChange: (identity: Identity | null) => void;
  identity: Identity | null;
}

export function IdentityModule({ onIdentityChange, identity }: Props) {
  const { user, isAuthenticated, logoutUser } = useNeynarContext();
  const [selectedIdentity, setSelectedIdentity] = useState<string>("username");
  const [verifications, setVerifications] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const userVerifications: string[] = [];
      
      if (user.verified_addresses?.eth_addresses) {
        user.verified_addresses.eth_addresses.forEach((addr: string) => {
          userVerifications.push(addr);
        });
      }
      
      setVerifications(userVerifications);
      
      const displayName = selectedIdentity === "username" 
        ? `@${user.username}` 
        : formatAddress(selectedIdentity);
      
      onIdentityChange({
        type: "farcaster",
        displayName,
        username: user.username,
        fid: user.fid,
        address: selectedIdentity === "username" ? undefined : selectedIdentity,
        verifications: userVerifications,
      });
    } else {
      onIdentityChange(null);
    }
  }, [isAuthenticated, user, selectedIdentity]);

  const formatAddress = (addr: string): string => {
    if (addr.endsWith('.eth') || addr.endsWith('.base.eth')) {
      return addr;
    }
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleIdentitySelect = (value: string) => {
    setSelectedIdentity(value);
  };

  const handleDisconnect = () => {
    logoutUser();
    setSelectedIdentity("username");
    setVerifications([]);
    onIdentityChange(null);
  };

  if (isAuthenticated && user) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-accent/30 rounded-xl blur opacity-30"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {user.pfp_url ? (
                  <img 
                    src={user.pfp_url} 
                    alt={user.username} 
                    className="w-10 h-10 rounded-full border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Signed in as</p>
                  <p className="text-lg font-display font-bold text-white" data-testid="text-identity">
                    @{user.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  className="text-muted-foreground hover:text-white"
                  data-testid="button-disconnect"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <label className="text-sm text-muted-foreground mb-2 block">Post as:</label>
              <Select value={selectedIdentity} onValueChange={handleIdentitySelect}>
                <SelectTrigger 
                  className="w-full bg-black/30 border-white/10 text-white"
                  data-testid="select-identity"
                >
                  <SelectValue placeholder="Select identity" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-white/10">
                  <SelectItem value="username" data-testid="select-item-username">
                    @{user.username}
                  </SelectItem>
                  {verifications.map((addr, idx) => (
                    <SelectItem key={addr} value={addr} data-testid={`select-item-addr-${idx}`}>
                      {formatAddress(addr)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {verifications.length === 0 && (
                <p className="text-xs text-muted-foreground/60 mt-2">
                  No verified addresses found. Add verifications in Warpcast settings.
                </p>
              )}
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
            <User className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-white mb-2">
            Sign in with Farcaster
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Connect your Farcaster account to seal the capsule with your identity.
          </p>
          
          <div className="flex justify-center" data-testid="button-connect-farcaster">
            <NeynarAuthButton />
          </div>
          
          <p className="mt-4 text-xs text-muted-foreground/60">
            Your identity prevents impersonation and enables sharing.
          </p>
        </div>
      </div>
    </div>
  );
}
