import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Lock, Unlock, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ArchiveItem {
  id: string;
  author: string;
  authorAddress?: string;
  sealedAt: string;
  revealDate: string;
  status: "locked" | "revealed";
  isMinted: boolean;
  transactionHash?: string;
}

interface ArchiveResponse {
  capsules: ArchiveItem[];
}

function formatToUTC(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false, 
    timeZone: 'UTC' 
  }) + ' UTC';
}

export function ArchiveTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useQuery<ArchiveResponse>({
    queryKey: ["/api/archive", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await fetch(`/api/archive?${params}`);
      if (!res.ok) throw new Error("Failed to fetch archive");
      return res.json();
    },
    refetchInterval: 2000, 
  });

  const handleSearch = () => {
    setDebouncedSearch(searchTerm);
  };

  const formatAddress = (addr?: string) => {
    if (!addr) return null;
    if (addr.includes(".eth")) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="w-full max-w-4xl mx-auto mt-12 mb-12"
    >
      <div className="glass-card rounded-2xl p-6 border border-[#1652F0]/20 bg-black/40">

        <div className="flex flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-display font-bold text-[#F8FAFC] glow-text whitespace-nowrap">
            Transparency Archive
          </h2>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="relative w-full max-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search address or ENS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-black/30 border-white/10 text-white w-full h-10"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={handleSearch}
              className="border-white/10 hover:bg-white/5 text-white h-10 px-6 font-bold"
            >
              Search
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#1652F0]" />
          </div>
        ) : !data?.capsules?.length ? (
          <div className="text-center py-12 text-slate-500">
            No capsules found. Be the first to send a message to the future!
          </div>
        ) : (
          /* HÖHE EXAKT AUF 468PX FIXIERT FÜR 7 ZEILEN OHNE BLITZER */
          <div className="overflow-x-auto overflow-y-auto max-h-[468px] custom-scrollbar border border-white/5 rounded-xl">
            <table className="w-full border-collapse relative">
              <thead className="sticky top-0 z-20">
                <tr className="border-b border-[#1652F0]/40 bg-[#0A0F1E]"> 
                  <th className="text-left py-3 px-4 text-xs text-[#CBD5E1] font-medium uppercase tracking-wider">
                    Author
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-[#CBD5E1] font-medium uppercase tracking-wider">
                    Sealed At (UTC)
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-[#CBD5E1] font-medium uppercase tracking-wider">
                    Revealed At (UTC)
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-[#CBD5E1] font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs text-[#CBD5E1] font-medium uppercase tracking-wider">
                    NFT
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.capsules.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#1652F0]/10 bg-transparent hover:bg-[#1652F0]/5 transition-colors cursor-pointer group h-[60px]"
                    onClick={() => window.location.href = `/capsule/${item.id}`}
                  >
                    <td className="py-2 px-4">
                      <span className="text-[#F8FAFC] font-bold group-hover:text-white transition-colors">
                        {item.author}
                      </span>
                      {item.authorAddress && !item.author.includes(".eth") && (
                        <p className="text-[10px] text-slate-500 font-mono">
                          {formatAddress(item.authorAddress)}
                        </p>
                      )}
                    </td>
                    <td className="py-2 px-4 text-sm text-slate-400">
                      {formatToUTC(item.sealedAt)}
                    </td>
                    <td className="py-2 px-4 text-sm text-slate-400">
                      {formatToUTC(item.revealDate)}
                    </td>
                    <td className="py-2 px-4">
                      {item.status === "revealed" ? (
                        <Badge variant="outline" className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400">
                          <Unlock className="w-3 h-3 mr-1" /> Revealed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-indigo-500/50 bg-indigo-500/10 text-indigo-400">
                          <Lock className="w-3 h-3 mr-1" /> Locked
                        </Badge>
                      )}
                    </td>
                    <td className="py-2 px-4" onClick={(e) => e.stopPropagation()}>
                      {item.isMinted && item.transactionHash ? (
                        <a href={`https://zora.co/collect/base:${item.transactionHash}`} target="_blank" className="text-[#6366F1] hover:underline text-sm font-medium">
                          View NFT <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500 italic">{item.status === "revealed" ? "Not minted" : "-"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}