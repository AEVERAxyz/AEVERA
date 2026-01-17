import { useState, useEffect, useRef } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import { Loader2, ExternalLink, User, AlertCircle, Layers } from "lucide-react"; 
import { CONTRACT_ADDRESS, cn } from "@/lib/utils";
import { parseAbiItem } from "viem";
import AeveraVaultABI from "@/abis/AeveraVaultABI.json"; 

// --- TYPE EXPORTIEREN FÜR MODAL ---
export interface MintEventData {
  txHash: string;
  minter: string;
  timestamp: bigint;
  type: "GENESIS" | "COPY";
  startSerial: number; 
  endSerial: number;   
  amount: number;      
  blockNumber: bigint;
  logIndex: number;
}

interface MintTableProps {
  capsuleId: bigint;
  isPrivate: boolean;
  onRowClick?: (nft: MintEventData) => void;
}

// Konfiguration für die intelligente Suche
const CHUNK_SIZE = 45000n; 
const MAX_CHUNKS = 20;      

export function MintTable({ capsuleId, isPrivate, onRowClick }: MintTableProps) {
  const [events, setEvents] = useState<MintEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  // Neuer State für die echte Gesamtzahl an NFTs
  const [totalMintedCount, setTotalMintedCount] = useState(0);

  const publicClient = usePublicClient();
  const isPollingRef = useRef(false);

  // Design-System
  const highlightColor = isPrivate ? "text-purple-400" : "text-cyan-400";
  const badgeBg = isPrivate ? "bg-purple-500/10" : "bg-cyan-500/10";
  const badgeBorder = isPrivate ? "border-purple-500/20" : "border-cyan-500/20";

  // ShortID direkt holen
  const { data: capsuleData } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: AeveraVaultABI,
    functionName: "capsules",
    args: [capsuleId],
  });

  const shortId = capsuleData ? (capsuleData as any)[2] : "...";

  // MAIN FETCH FUNCTION
  const fetchSmartHistory = async (isBackgroundUpdate = false) => {
      if (!publicClient || isPollingRef.current) return;

      if (!isBackgroundUpdate) {
          setIsLoading(true);
          setError(null);
          setStatusMsg("Syncing Blockchain History...");
      }

      isPollingRef.current = true; // Lock

      try {
        const filterId = BigInt(capsuleId);
        const currentBlock = await publicClient.getBlockNumber();

        let fromBlock = currentBlock - CHUNK_SIZE;
        let toBlock = currentBlock;
        let foundGenesis = false;
        let allLogs: any[] = [];
        let chunkCount = 0;

        // --- SMART BACKWARDS LOOP ---
        while (!foundGenesis && chunkCount < MAX_CHUNKS && toBlock > 0n) {
            if (fromBlock < 0n) fromBlock = 0n;

            const [genesisLogs, mintLogs] = await Promise.all([
                publicClient.getLogs({
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    event: parseAbiItem('event CapsuleCreated(uint256 indexed id, string uuid, string shortId, address indexed author)'),
                    args: { id: filterId }, 
                    fromBlock: fromBlock,
                    toBlock: toBlock
                }),
                publicClient.getLogs({
                    address: CONTRACT_ADDRESS as `0x${string}`,
                    event: parseAbiItem('event CapsuleMinted(uint256 indexed id, address indexed minter, uint256 amount)'),
                    args: { id: filterId },
                    fromBlock: fromBlock,
                    toBlock: toBlock
                })
            ]);

            const chunkEvents = [
                ...genesisLogs.map(l => ({ ...l, _type: "GENESIS" })), 
                ...mintLogs.map(l => ({ ...l, _type: "COPY" }))
            ];

            allLogs.push(...chunkEvents);

            if (genesisLogs.length > 0) {
                foundGenesis = true; 
            }

            toBlock = fromBlock - 1n;
            fromBlock = toBlock - CHUNK_SIZE;
            chunkCount++;
        }

        // --- DATEN VERARBEITEN ---
        if(!isBackgroundUpdate) setStatusMsg("Resolving Timestamps...");

        const rawEvents = await Promise.all(allLogs.map(async (log: any) => {
            let timestamp = 0n;
            try {
                const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                timestamp = block.timestamp;
            } catch (e) {
                console.warn("Block time fetch failed", e);
            }

            const amount = log._type === "GENESIS" ? 1 : Number(log.args.amount || 1);

            return {
                txHash: log.transactionHash,
                minter: log._type === "GENESIS" ? log.args.author : log.args.minter,
                timestamp: timestamp,
                type: log._type as "GENESIS" | "COPY",
                amount: amount,
                blockNumber: log.blockNumber,
                logIndex: log.logIndex,
            };
        }));

        rawEvents.sort((a, b) => {
            if (a.blockNumber < b.blockNumber) return -1;
            if (a.blockNumber > b.blockNumber) return 1;
            return a.logIndex < b.logIndex ? -1 : 1;
        });

        let runningCounter = 0; 

        const calculatedEvents: MintEventData[] = rawEvents.map((event) => {
            const startSerial = runningCounter;
            const endSerial = runningCounter + event.amount - 1;

            runningCounter += event.amount;

            return {
                ...event,
                startSerial,
                endSerial,
                serialNumber: startSerial 
            };
        });

        setTotalMintedCount(runningCounter);
        setEvents(calculatedEvents.reverse());

      } catch (err: any) {
        console.error("Smart Sync Error:", err);
        if(!isBackgroundUpdate) setError(err.message || "Failed to sync history.");
      } finally {
        setIsLoading(false);
        isPollingRef.current = false; // Unlock
      }
  };

  useEffect(() => {
    fetchSmartHistory(); 

    const interval = setInterval(() => {
        fetchSmartHistory(true); 
    }, 5000);

    return () => clearInterval(interval);
  }, [publicClient, capsuleId]);

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

  return (
    <div className="w-full mt-12 mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">

      <div className="glass-card rounded-2xl p-4 md:p-8 border border-[#1652F0]/20 bg-black/40">

        <div className="flex flex-col justify-start items-start mb-8">
            <h3 className="text-2xl font-display font-bold text-[#F8FAFC] glow-text flex items-center gap-2">
               Capsule Legacy
            </h3>
            <p className="text-sm text-slate-400 mt-1">
                A total of <span className="text-[#F8FAFC] font-bold">{totalMintedCount}</span> unique digital artifacts of this sealed moment have been minted.
            </p>
        </div>

        <div className="border border-white/5 rounded-xl overflow-hidden h-[500px] flex flex-col relative bg-[#020617]/50">
            <div className="overflow-y-auto custom-scrollbar flex-1 w-full absolute inset-0">
                <table className="w-full border-collapse min-w-[600px] text-left">
                    <thead className="bg-[#0A0F1E] text-xs text-[#CBD5E1] font-medium uppercase tracking-wider sticky top-0 z-10 shadow-sm shadow-black/80">
                        <tr>
                            <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">ID</th>
                            {/* NEW POSITION: Quantity (Second Column) */}
                            <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Quantity</th>
                            <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Edition</th>
                            <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Collector</th>
                            <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E]">Minted At (UTC)</th>
                            <th className="py-4 px-6 border-b border-[#1652F0]/20 bg-[#0A0F1E] text-right">Proof</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#1652F0]" />
                                        <span className="text-xs font-mono opacity-70">{statusMsg}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-red-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : events.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-slate-500">
                                    No records found. This capsule hasn't been minted yet.
                                </td>
                            </tr>
                        ) : (
                            events.map((mint) => (
                                <tr 
                                    key={mint.txHash} 
                                    onClick={() => onRowClick && onRowClick(mint)}
                                    className="hover:bg-[#1652F0]/5 transition-colors group cursor-pointer"
                                >

                                    {/* ID (SHORT ID) */}
                                    <td className="py-4 px-6">
                                        <span className={cn("font-mono text-sm font-bold", highlightColor)}>
                                            #{shortId}
                                        </span>
                                    </td>

                                    {/* QUANTITY COLUMN (MOVED HERE) */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-1.5 text-sm text-white font-bold font-mono">
                                            <Layers className="w-3 h-3 text-slate-500" />
                                            {mint.amount}
                                        </div>
                                    </td>

                                    {/* EDITION (SMART RANGE DISPLAY) */}
                                    <td className="py-4 px-6">
                                        <span className={cn(
                                            "font-mono text-sm",
                                            mint.type === "GENESIS" ? highlightColor : "text-slate-400"
                                        )}>
                                            {mint.amount > 1 
                                                ? `#${mint.startSerial} - #${mint.endSerial}` 
                                                : `#${mint.startSerial}`
                                            }
                                        </span>
                                    </td>

                                    {/* COLLECTOR */}
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 font-mono text-sm text-slate-300">
                                            <User className="w-3 h-3 text-slate-500" />
                                            <span className="group-hover:text-white transition-colors">
                                                {mint.minter.startsWith("0x") 
                                                    ? `${mint.minter.slice(0, 6)}...${mint.minter.slice(-4)}` 
                                                    : mint.minter}
                                            </span>

                                            {/* AUTHOR BADGE */}
                                            {mint.type === "GENESIS" && (
                                                <span className={cn(
                                                    "ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border font-medium",
                                                    badgeBg, highlightColor, badgeBorder
                                                )}>
                                                    AUTHOR
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* TIMESTAMP */}
                                    <td className="py-4 px-6 text-sm text-slate-400">
                                        {formatDate(mint.timestamp)}
                                    </td>

                                    {/* PROOF LINK (Last Column) */}
                                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                        <a 
                                          href={`https://sepolia.basescan.org/tx/${mint.txHash}`}
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-[#1652F0] transition-colors group/link"
                                        >
                                          View TX
                                          <ExternalLink className="w-3 h-3 group-hover/link:-translate-y-0.5 transition-transform" />
                                        </a>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}