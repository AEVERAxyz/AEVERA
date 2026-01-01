import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Lock, Unlock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface ArchiveItem {
  id: string;
  author: string;
  authorAddress?: string;
  sealedAt: string;
  revealDate: string;
  status: "locked" | "revealed";
  isMinted: boolean;
  mintCount: number; // Neu: Aktueller Stand der Mints
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
      className="w-full max-w-4xl mx-auto mt-12 mb-12 px-4 sm:px-0"
    >
      <div className="glass-card rounded-2xl p-4 md:p-6 border border-[#1652F0]/20 bg-black/40">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-display font-bold text-[#F8FAFC] glow-text whitespace-nowrap">
            Transparency Archive
          </h2>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 justify-end">
            <div className="relative w-full sm:max-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Search address or ENS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-black/30 border-white/10 text-white w-full h-10 focus:ring-[#1652F0]/50"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={handleSearch}
              className="border-white/10 hover:bg-white/5 text-white h-10 px-4 md:px-6 font-bold shrink-0"
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
          /* TABLE CONTAINER */
          <div className="overflow-x-auto border border-white/5 rounded-xl">
            <div className="max-h-[468px] overflow-y-auto custom-scrollbar">
              <table className="w-full border-collapse relative min-w-[600px]">
                <thead className="sticky top-0 z-20 bg-[#0A0F1E]">
                  <tr className="border-b border-[#1652F0]/40"> 
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
                      NFT Supply
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
                        <div className="flex flex-col">
                          <span className="text-[#F8FAFC] font-bold group-hover:text-white transition-colors truncate max-w-[120px]">
                            {item.author}
                          </span>
                          {item.authorAddress && !item.author.includes(".eth") && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              {formatAddress(item.authorAddress)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-4 text-sm text-slate-400 whitespace-nowrap">
                        {formatToUTC(item.sealedAt)}
                      </td>
                      <td className="py-2 px-4 text-sm text-slate-400 whitespace-nowrap">
                        {formatToUTC(item.revealDate)}
                      </td>
                      <td className="py-2 px-4">
                        {item.status === "revealed" ? (
                          <Badge variant="outline" className="border-cyan-500/50 bg-cyan-500/10 text-cyan-400 whitespace-nowrap">
                            <Unlock className="w-3 h-3 mr-1" /> Revealed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-indigo-500/50 bg-indigo-500/10 text-indigo-400 whitespace-nowrap">
                            <Lock className="w-3 h-3 mr-1" /> Locked
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <div className="flex flex-col">
                           <span className={`text-sm font-mono font-bold ${item.mintCount >= 100 ? 'text-rose-500' : 'text-emerald-400'}`}>
                              {item.mintCount || 0} / 100
                           </span>
                           <span className="text-[9px] uppercase tracking-tighter text-slate-500">
                              {item.mintCount >= 100 ? 'Sold Out' : 'Available'}
                           </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}