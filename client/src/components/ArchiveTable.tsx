import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Lock, Unlock, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
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
    refetchInterval: 30000,
  });

  const handleSearch = () => {
    setDebouncedSearch(searchTerm);
  };

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "MMM d, yyyy");
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
      className="w-full max-w-4xl mx-auto mt-12"
    >
      <div className="glass-card rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-display font-bold text-soft">
            Transparency Archive
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-muted" />
              <Input
                placeholder="Search by address or ENS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-black/30 border-white/10 text-soft w-full sm:w-64"
                data-testid="input-archive-search"
              />
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={handleSearch}
              className="border-white/10"
              data-testid="button-archive-search"
            >
              Search
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !data?.capsules?.length ? (
          <div className="text-center py-12 text-soft-muted">
            No capsules found. Be the first to send a message to the future!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-xs text-soft-muted font-medium uppercase tracking-wider">
                    Author
                  </th>
                  <th className="text-left py-3 px-2 text-xs text-soft-muted font-medium uppercase tracking-wider">
                    Sealed At
                  </th>
                  <th className="text-left py-3 px-2 text-xs text-soft-muted font-medium uppercase tracking-wider">
                    Reveal Date
                  </th>
                  <th className="text-left py-3 px-2 text-xs text-soft-muted font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-2 text-xs text-soft-muted font-medium uppercase tracking-wider">
                    NFT
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.capsules.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover-elevate"
                    data-testid={`row-capsule-${item.id}`}
                  >
                    <td className="py-3 px-2">
                      <a
                        href={`/capsule/${item.id}`}
                        className="text-soft hover:text-primary transition-colors font-medium"
                        data-testid={`link-capsule-${item.id}`}
                      >
                        {item.author}
                      </a>
                      {item.authorAddress && !item.author.includes(".eth") && (
                        <p className="text-xs text-soft-muted/60">
                          {formatAddress(item.authorAddress)}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-2 text-sm text-soft-muted">
                      {formatDate(item.sealedAt)}
                    </td>
                    <td className="py-3 px-2 text-sm text-soft-muted">
                      {formatDate(item.revealDate)}
                    </td>
                    <td className="py-3 px-2">
                      {item.status === "revealed" ? (
                        <Badge
                          variant="outline"
                          className="border-green-500/30 bg-green-500/10 text-green-400"
                        >
                          <Unlock className="w-3 h-3 mr-1" />
                          Revealed
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/30 bg-amber-500/10 text-amber-400"
                        >
                          <Lock className="w-3 h-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {item.isMinted && item.transactionHash ? (
                        <a
                          href={`https://zora.co/collect/base:${item.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                          data-testid={`link-nft-${item.id}`}
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : item.status === "revealed" ? (
                        <span className="text-xs text-soft-muted/60">
                          Not minted
                        </span>
                      ) : (
                        <span className="text-xs text-soft-muted/40">-</span>
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
