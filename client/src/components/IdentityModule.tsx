import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, CheckCircle, Loader2 } from "lucide-react";
import { SiFarcaster } from "react-icons/si";
import { BaseLogo } from "./icons/BaseLogo";
import { CoinbaseWalletSDK } from "@coinbase/wallet-sdk";

export interface Identity {
  type: "farcaster" | "wallet";
  displayName: string;
  username?: string;
  fid?: number;
  address?: string;
  pfpUrl?: string;
  verifications?: string[];
  signerUuid?: string;
}

interface Props {
  onIdentityChange: (identity: Identity | null) => void;
  identity: Identity | null;
}

interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  verified_addresses?: {
    eth_addresses?: string[];
  };
}

interface SIWNData {
  fid: number;
  signer_uuid: string;
}

declare global {
  interface Window {
    onSignInSuccess?: (data: SIWNData) => void;
  }
}

const NEYNAR_CLIENT_ID = import.meta.env.VITE_NEYNAR_CLIENT_ID || "";

async function resolveEnsName(address: string): Promise<string | null> {
  try {
    const response = await fetch(`/api/resolve-ens/${address}`);
    if (response.ok) {
      const data = await response.json();
      return data.ensName || null;
    }
  } catch (e) {
    console.error("ENS resolution failed:", e);
  }
  return null;
}

export function IdentityModule({ onIdentityChange, identity }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [selectedIdentity, setSelectedIdentity] = useState<string>("username");
  const [verifications, setVerifications] = useState<string[]>([]);
  const [addressToEns, setAddressToEns] = useState<Record<string, string>>({});
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletEns, setWalletEns] = useState<string | null>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const formatAddress = useCallback((addr: string): string => {
    const ensName = addressToEns[addr.toLowerCase()];
    if (ensName) return ensName;
    if (addr.endsWith('.eth') || addr.endsWith('.base.eth')) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [addressToEns]);

  const updateIdentityFromUser = useCallback((userData: NeynarUser, selected: string, signer: string) => {
    const userVerifications: string[] = [];
    
    if (userData.verified_addresses?.eth_addresses) {
      userData.verified_addresses.eth_addresses.forEach((addr: string) => {
        userVerifications.push(addr);
      });
    }
    
    setVerifications(userVerifications);
    
    const displayName = selected === "username" 
      ? `@${userData.username}` 
      : formatAddress(selected);
    
    onIdentityChange({
      type: "farcaster",
      displayName,
      username: userData.username,
      fid: userData.fid,
      address: selected === "username" ? undefined : selected,
      pfpUrl: userData.pfp_url,
      verifications: userVerifications,
      signerUuid: signer,
    });
  }, [onIdentityChange, formatAddress]);

  useEffect(() => {
    const storedUser = localStorage.getItem("farcaster_user");
    const storedSigner = localStorage.getItem("neynar_signer_uuid");
    const storedWallet = localStorage.getItem("wallet_address");
    const storedWalletEns = localStorage.getItem("wallet_ens");
    
    if (storedUser && storedSigner) {
      try {
        const parsedUser = JSON.parse(storedUser) as NeynarUser;
        setUser(parsedUser);
        setSignerUuid(storedSigner);
        updateIdentityFromUser(parsedUser, "username", storedSigner);
      } catch (e) {
        localStorage.removeItem("farcaster_user");
        localStorage.removeItem("neynar_signer_uuid");
      }
    } else if (storedWallet) {
      setWalletAddress(storedWallet);
      if (storedWalletEns) setWalletEns(storedWalletEns);
      onIdentityChange({
        type: "wallet",
        displayName: storedWalletEns || `${storedWallet.slice(0, 6)}...${storedWallet.slice(-4)}`,
        address: storedWallet,
      });
    }
  }, [updateIdentityFromUser, onIdentityChange]);

  useEffect(() => {
    if (verifications.length === 0) return;
    
    const resolveNames = async () => {
      const newMappings: Record<string, string> = {};
      for (const addr of verifications) {
        const ensName = await resolveEnsName(addr);
        if (ensName) {
          newMappings[addr.toLowerCase()] = ensName;
        }
      }
      if (Object.keys(newMappings).length > 0) {
        setAddressToEns(prev => ({ ...prev, ...newMappings }));
      }
    };
    
    resolveNames();
  }, [verifications]);

  useEffect(() => {
    window.onSignInSuccess = async (data: SIWNData) => {
      console.log("SIWN success callback received:", data);
      setIsLoading(true);
      setLoadingType("farcaster");
      setSignerUuid(data.signer_uuid);
      localStorage.setItem("neynar_signer_uuid", data.signer_uuid);
      
      try {
        const response = await fetch(`/api/farcaster/user/${data.fid}`);
        if (response.ok) {
          const userData = await response.json() as NeynarUser;
          console.log("User data fetched:", userData);
          setUser(userData);
          localStorage.setItem("farcaster_user", JSON.stringify(userData));
          updateIdentityFromUser(userData, "username", data.signer_uuid);
        } else {
          console.error("Failed to fetch user data:", response.status);
        }
      } catch (e) {
        console.error("Failed to fetch user data:", e);
      } finally {
        setIsLoading(false);
        setLoadingType(null);
      }
    };

    return () => {
      delete window.onSignInSuccess;
    };
  }, [updateIdentityFromUser]);

  useEffect(() => {
    if (user || scriptLoaded) return;

    const existingScript = document.querySelector('script[src*="siwn"]');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://neynarxyz.github.io/siwn/raw/1.2.0/index.js";
    script.async = true;
    script.onload = () => {
      console.log("SIWN script loaded");
      setScriptLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode && !user) {
        script.parentNode.removeChild(script);
      }
    };
  }, [user, scriptLoaded]);

  const connectCoinbaseWallet = async () => {
    try {
      setIsLoading(true);
      setLoadingType("wallet");
      
      const sdk = new CoinbaseWalletSDK({
        appName: "TimeCapsule",
        appLogoUrl: `${window.location.origin}/favicon.ico`,
      });

      const provider = sdk.makeWeb3Provider();
      const accounts = await provider.request({ method: "eth_requestAccounts" }) as string[];
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        localStorage.setItem("wallet_address", address);
        
        const ensName = await resolveEnsName(address);
        if (ensName) {
          setWalletEns(ensName);
          localStorage.setItem("wallet_ens", ensName);
        }
        
        onIdentityChange({
          type: "wallet",
          displayName: ensName || `${address.slice(0, 6)}...${address.slice(-4)}`,
          address,
        });
      }
    } catch (e) {
      console.error("Wallet connection failed:", e);
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleIdentitySelect = (value: string) => {
    setSelectedIdentity(value);
    if (user && signerUuid) {
      updateIdentityFromUser(user, value, signerUuid);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("farcaster_user");
    localStorage.removeItem("neynar_signer_uuid");
    localStorage.removeItem("wallet_address");
    localStorage.removeItem("wallet_ens");
    setUser(null);
    setWalletAddress(null);
    setWalletEns(null);
    setSignerUuid(null);
    setSelectedIdentity("username");
    setVerifications([]);
    setAddressToEns({});
    onIdentityChange(null);
    setScriptLoaded(false);
    
    const existingScript = document.querySelector('script[src*="siwn"]');
    if (existingScript && existingScript.parentNode) {
      existingScript.parentNode.removeChild(existingScript);
    }
    
    setTimeout(() => {
      const script = document.createElement("script");
      script.src = "https://neynarxyz.github.io/siwn/raw/1.2.0/index.js";
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-20"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-3 text-soft-muted">
            {loadingType === "farcaster" ? "Signing in with Farcaster..." : "Connecting wallet..."}
          </p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-20"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {user.pfp_url ? (
                  <img 
                    src={user.pfp_url} 
                    alt={user.username} 
                    className="w-10 h-10 rounded-full border border-white/20"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <User className="w-5 h-5 text-[#E0E0E0]" />
                  </div>
                )}
                <div>
                  <p className="text-xs text-soft-muted uppercase tracking-wider">Signed in as</p>
                  <p className="text-lg font-display font-bold text-soft" data-testid="text-identity">
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
                  className="text-soft-muted hover:text-soft"
                  data-testid="button-disconnect"
                >
                  Sign Out
                </Button>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <label className="text-sm text-soft-muted mb-2 block">Post as:</label>
              <Select value={selectedIdentity} onValueChange={handleIdentitySelect}>
                <SelectTrigger 
                  className="w-full bg-black/30 border-white/10 text-soft"
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
                <p className="text-xs text-soft-muted/60 mt-2">
                  No verified addresses found. Add verifications in Warpcast settings.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (walletAddress) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur opacity-20"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0052FF] flex items-center justify-center">
                <BaseLogo className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-soft-muted uppercase tracking-wider">Base Wallet</p>
                <p className="text-lg font-display font-bold text-soft" data-testid="text-identity">
                  {walletEns || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-soft-muted hover:text-soft"
                data-testid="button-disconnect"
              >
                Disconnect
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
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/15 to-accent/15 rounded-xl blur opacity-15"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center ring-2 ring-white/10">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-soft mb-2">
            Connect Your Identity
          </h3>
          <p className="text-sm text-soft-muted mb-6">
            Sign in to seal the capsule with your identity.
          </p>
          
          <div className="space-y-3">
            <div className="absolute -left-[9999px] opacity-0 pointer-events-none" data-testid="siwn-container">
              <div 
                className="neynar_signin"
                data-client_id={NEYNAR_CLIENT_ID}
                data-success-callback="onSignInSuccess"
                data-theme="dark"
              />
            </div>
            
            <Button
              variant="outline"
              className="w-full h-12 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-soft gap-2"
              onClick={() => {
                const siwnBtn = document.querySelector('.neynar_signin button') as HTMLButtonElement;
                if (siwnBtn) {
                  siwnBtn.click();
                } else {
                  console.error("SIWN button not found - script may not be loaded yet");
                }
              }}
              data-testid="button-farcaster-login"
            >
              <SiFarcaster className="w-5 h-5 text-purple-400" />
              Sign in with Farcaster
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 border-[#0052FF]/30 bg-[#0052FF]/10 text-soft gap-2"
              onClick={connectCoinbaseWallet}
              data-testid="button-wallet-login"
            >
              <BaseLogo className="w-5 h-5" />
              Sign in with Base Wallet
            </Button>
          </div>
          
          <p className="mt-4 text-xs text-soft-muted/60">
            Your identity prevents impersonation and enables sharing.
          </p>
        </div>
      </div>
    </div>
  );
}
