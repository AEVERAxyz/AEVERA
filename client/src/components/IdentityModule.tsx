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

// Deine Client ID fest eingetragen
const NEYNAR_CLIENT_ID = "4e8fc6b3-c3fe-49e6-b1bd-a5b5f3e7d593"; 

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
  const [walletSelectedIdentity, setWalletSelectedIdentity] = useState<string>("address");

  const formatAddress = useCallback((addr: string): string => {
    const lower = addr.toLowerCase();
    if (lower.includes("ada0")) return "gelassen.base.eth";
    if (lower.includes("1289") || lower.includes("2767")) return "gelassen.eth";
    const ensName = addressToEns[lower];
    if (ensName) return ensName;
    return ""; 
  }, [addressToEns]);

  const updateIdentityFromUser = useCallback((userData: NeynarUser, selected: string, signer: string) => {
    const userVerifications: string[] = [];
    if (userData.verified_addresses?.eth_addresses) {
      userData.verified_addresses.eth_addresses.forEach((addr: string) => {
        userVerifications.push(addr);
      });
    }
    setVerifications(userVerifications);
    let displayName = selected === "username" ? `@${userData.username}` : formatAddress(selected);
    if (!displayName && selected !== "username") displayName = "Anonymous";

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
      const base = storedWallet.toLowerCase().includes("ada0") ? "gelassen.base.eth" : null;
      onIdentityChange({
        type: "wallet",
        displayName: base || storedWalletEns || "Anonymous",
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
          setUser(userData);
          localStorage.setItem("farcaster_user", JSON.stringify(userData));
          updateIdentityFromUser(userData, "username", data.signer_uuid);
        }
      } catch (e) {
        console.error("Failed to fetch user data:", e);
      } finally {
        setIsLoading(false);
        setLoadingType(null);
      }
    };
    return () => { delete window.onSignInSuccess; };
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

  const connectCoinbaseWallet = async (e: React.MouseEvent) => {
    e.preventDefault(); 
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
        const base = address.toLowerCase().includes("ada0") ? "gelassen.base.eth" : null;
        onIdentityChange({
          type: "wallet",
          displayName: base || ensName || "Anonymous",
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

  const handleDisconnect = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
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
          <p className="mt-3 text-soft-muted">Signing in...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-[#1652F0]/20 rounded-xl blur opacity-20"></div>
        <div className="relative bg-black/50 border border-[#1652F0]/30 rounded-xl p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {user.pfp_url ? (
                    <img src={user.pfp_url} alt={user.username} className="w-10 h-10 rounded-full border border-white/20"/>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-[#E0E0E0]" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black">
                    <SiFarcaster className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#CBD5E1] uppercase tracking-wider flex items-center gap-1">
                    <SiFarcaster className="w-3 h-3 text-purple-400" />
                    Signed in as
                  </p>
                  <p className="text-lg font-display font-bold text-[#F8FAFC]" data-testid="text-identity">@{user.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <Button variant="ghost" size="sm" onClick={handleDisconnect} className="text-soft-muted hover:text-soft" type="button">Sign Out</Button>
              </div>
            </div>
            {/* Identity Select Dropdown */}
            <div className="border-t border-[#1652F0]/30 pt-4">
              <label className="text-sm text-[#1652F0] mb-2 block font-medium">Post as:</label>
              <Select value={selectedIdentity} onValueChange={handleIdentitySelect}>
                <SelectTrigger className="w-full bg-black/30 border-[#1652F0]/30 text-[#F8FAFC]">
                  <SelectValue placeholder="Select identity" />
                </SelectTrigger>
                <SelectContent className="bg-black/90 border-[#1652F0]/30">
                  <SelectItem value="username">@{user.username}</SelectItem>
                  {verifications.map((addr, idx) => {
                    const name = formatAddress(addr);
                    if (!name) return null;
                    return <SelectItem key={addr} value={addr}>{name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Wallet View
  if (walletAddress) {
    const baseName = walletAddress.toLowerCase().includes("ada0") ? "gelassen.base.eth" : null;
    const walletIdentityOptions = [];
    if (baseName) walletIdentityOptions.push({ value: "base", label: baseName });
    if (walletEns) walletIdentityOptions.push({ value: "ens", label: walletEns });
    if (walletIdentityOptions.length === 0) walletIdentityOptions.push({ value: "anon", label: "Anonymous" });

    return (
      <div className="relative group">
        <div className="relative bg-black/50 border border-[#1652F0]/30 rounded-xl p-4">
           {/* Einfacher Wallet View (gekürzt für Übersicht) */}
           <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleDisconnect} type="button">Disconnect</Button>
           </div>
        </div>
      </div>
    );
  }

  // LOGIN VIEW - DEBUG MODE
  return (
    <div className="space-y-4">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/15 to-accent/15 rounded-xl blur opacity-15"></div>
        <div className="relative bg-black/50 border border-white/10 rounded-xl p-6 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center ring-2 ring-white/10">
            <User className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-display font-bold text-soft mb-2">Connect Your Identity</h3>
          <p className="text-sm text-soft-muted mb-6">Sign in to seal the capsule with your identity.</p>

          <div className="space-y-3 flex flex-col items-center">

            {/* === DEBUG: Der echte Neynar Button === */}
            {/* Wir machen ihn sichtbar (kein hidden/opacity-0) und geben ihm einen roten Rahmen */}
            <div className="w-full flex justify-center p-2 border border-red-500/50 rounded mb-2 bg-red-500/10">
              <p className="text-xs text-red-300 mb-1 w-full">TEST: Original Neynar Button 👇</p>
              <div 
                className="neynar_signin"
                data-client_id={NEYNAR_CLIENT_ID}
                data-success-callback="onSignInSuccess"
                data-theme="dark"
              />
            </div>
            {/* ==================================== */}

            <Button type="button" variant="outline" className="w-full h-12 border-[#0052FF]/30 bg-[#0052FF]/10 text-soft gap-2" onClick={connectCoinbaseWallet}>
              <BaseLogo className="w-5 h-5" /> Sign in with Base Wallet
            </Button>
          </div>
          <p className="mt-4 text-xs text-soft-muted/60">Your identity prevents impersonation and enables sharing.</p>
        </div>
      </div>
    </div>
  );
}