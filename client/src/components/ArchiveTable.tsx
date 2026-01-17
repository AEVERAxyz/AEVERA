import { useReadContract, useReadContracts } from "wagmi";
import { useLocation } from "wouter";
// FIX: 'Lock' entfernt, da unbenutzt
import { Search, Loader2, Unlock, Globe, Shield, ExternalLink, Timer, Layers } from "lucide-react"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { CONTRACT_ADDRESS, cn } from "@/lib/utils"; 
import AeveraVaultABI from "@/abis/AeveraVaultABI.json"; 

export function ArchiveTable() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  // 1. Hole 'nextTokenId' (Alle 3s aktualisieren)
  const { data: nextTokenId, isLoading: isCountLoading } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AeveraVaultABI,
    functionName: "nextTokenId", 
    query: { refetchInterval: 3000 }
  });

  // 2. Berechne die IDs rückwärts (Die neuesten 50)
  const capsuleIds = useMemo(() => {
    if (!nextTokenId) return [];
    const maxId = Number(nextTokenId) - 1;
    if (maxId < 1) return [];

    const ids = [];
    for (let i = maxId; i > 0 && i > maxId - 50; i--) {
        ids.push(BigInt(i));
    }
    return ids;
  }, [nextTokenId]);

  // 3. Batch Fetching der Kapsel-Daten (Standard Read - Schnell & Stabil)
  const { data: rawCapsuleData, isLoading: isDataLoading } = useReadContracts({
    contracts: capsuleIds.map((id) => ({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: AeveraVaultABI as any,
      functionName: "capsules",
      args: [id],
    })),
    query: { refetchInterval: 3000 }
  });

  // 4. Daten Mappen (Keine komplexe Logik mehr, nur pure Daten)
  const processedCapsules = useMemo(() => {
    if (!rawCapsuleData) return [];

    const capsules = rawCapsuleData
      .map((result, index) => {
        if (result.status !== "success" || !result.result) return null;

        const data = result.result as any; 
        const idBigInt = capsuleIds[index];

        // --- FIX FOR DATA SHIFTING (Contract V12 Update) ---
        // 0: id, 1: uuid, 2: shortId, 3: author, 4: creator (NEW), 
        // 5: content, 6: mintTimestamp, 7: unlockTimestamp, 8: isPrivate, 9: currentSupply

        const shortId = data[2];
        const author = data[3];
        // data[4] is creator address
        const sealedAt = data[6]; // Shifted from 5 to 6
        const revealDate = data[7]; // Shifted from 6 to 7
        const isPrivate = data[8]; // Shifted from 7 to 8
        const currentSupply = data[9]; // New Field: Supply

        const now = Math.floor(Date.now() / 1000);
        const isRevealedTime = Number(revealDate) <= now;

        return {
          id: idBigInt,
          shortId: shortId,            
          author: author,
          sealedAt: sealedAt,
          revealDate: revealDate,
          isPrivate: isPrivate,
          isRevealed: isRevealedTime,
          minted: currentSupply ? currentSupply.toString() : "0"
        };
      })
      .filter((c) => c !== null); 

    if (search) {
      const lowerSearch = search.toLowerCase();
      return capsules.filter((c) => 
        c!.author.toLowerCase().includes(lowerSearch) || 
        c!.shortId.toLowerCase().includes(lowerSearch) 
      );
    }

    return capsules;
  }, [rawCapsuleData, capsuleIds, search]);

  const formatDate = (timestamp: bigint) => {
    if (!timestamp) return "-";
    return new Date(Number(timestamp) * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }) + ' UTC';
  };

  const handleRowClick = (shortId: string) => {
    setLocation(`/capsule/${shortId}`);
  };

  const isLoading = isCountLoading || isDataLoading;

  return (
    <div className="w-full mt-12 mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700"> {/* Full Width Container */}
      <div className="glass-card rounded-2xl p-4 md:p-8 border border-[#1652F0]/20 bg-black/40">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold text-[#F8FAFC] glow-text">
              Transparency Archive
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              {processedCapsules.length} messages sealed in time
            </p>
          </div>

          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search address or ID..." 
                className="pl-10 bg-black/50 border-white/10 text-white placeholder:text-slate-600 focus:border-[#1652F0]/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
              Search
            </Button>
          </div>
        </div>

        <div className="border border-white/5 rounded-xl overflow-hidden h-[500px] flex flex-col relative bg-[#020617]/50">
            <div className="overflow-y-auto custom-scrollbar flex-1 w-full absolute inset-0">
                <table className="w-full border-collapse min-w-[900px] text-left">
                  <thead className="bg-[#0A0F1E] text-xs text-[#CBD5E1] font-medium uppercase tracking-wider sticky top-0 z-10 shadow-sm shadow-black/80">
                    <tr>
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Author</th>
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Sealed At (UTC)</th>
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Revealed At (UTC)</th>
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">ID</th>
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Mode</th>
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Status</th>

                      {/* TAUSCH: On-Chain Proof jetzt hier */}
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">On-Chain Proof</th>

                      {/* TAUSCH: NFT MINTED jetzt ganz rechts */}
                      <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E] text-right">NFT MINTED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Reading from Blockchain...
                        </td>
                      </tr>
                    ) : processedCapsules.length === 0 ? (
                      <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            The archive is waiting for the first seal.
                          </td>
                      </tr>
                    ) : (
                      processedCapsules.map((capsule) => {
                        if(!capsule) return null;

                        // Max Supply Berechnung
                        const maxSupply = capsule.isPrivate ? 1000 : 100;

                        return (
                          <tr 
                            key={capsule.id.toString()} 
                            onClick={() => handleRowClick(capsule.shortId)}
                            className="hover:bg-[#1652F0]/5 transition-colors group cursor-pointer"
                          >
                            <td className="py-4 px-6">
                              <div className="font-bold text-[#F8FAFC] text-sm group-hover:text-[#1652F0] transition-colors font-mono">
                                {capsule.author.startsWith("0x") 
                                  ? `${capsule.author.slice(0, 6)}...${capsule.author.slice(-4)}`
                                  : capsule.author}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-slate-400">{formatDate(capsule.sealedAt)}</td>
                            <td className="py-4 px-6 text-sm text-slate-400">{formatDate(capsule.revealDate)}</td>
                            <td className="py-4 px-6 text-sm font-mono text-blue-400 group-hover:underline decoration-blue-500/50 underline-offset-4">
                                #{capsule.shortId}
                            </td>
                            <td className="py-4 px-6">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                capsule.isPrivate 
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                                  : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              )}>
                                 {capsule.isPrivate ? <Shield className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                 {capsule.isPrivate ? "Private" : "Public"}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                capsule.isRevealed
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              )}>
                                {capsule.isRevealed ? <Unlock className="w-3 h-3" /> : <Timer className="w-3 h-3" />}
                                {capsule.isRevealed ? "Revealed" : "Sealed"}
                              </div>
                            </td>

                             {/* TAUSCH: Proof Link hier (links von Minted) */}
                             <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                <a 
                                  href={`https://sepolia.basescan.org/token/${CONTRACT_ADDRESS}?a=${capsule.id.toString()}`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-[#1652F0] transition-colors group/link"
                                >
                                  View Token
                                  <ExternalLink className="w-3 h-3 group-hover/link:-translate-y-0.5 transition-transform" />
                                </a>
                             </td>

                            {/* TAUSCH & UPDATE: Minted Count / Max Supply ganz rechts */}
                            <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5 text-sm text-slate-300 font-mono">
                                    <Layers className="w-3 h-3 text-slate-500" />
                                    <span>{capsule.minted}</span>
                                    <span className="text-slate-600">/</span>
                                    <span className="text-slate-500">{maxSupply}</span>
                                </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}