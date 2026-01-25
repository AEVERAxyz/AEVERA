import { useState, useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { Loader2, ExternalLink, User, AlertCircle, Layers } from "lucide-react"; 
import { cn } from "@/lib/utils";
import { parseAbiItem, createPublicClient, http } from "viem"; 
import AeveraVaultABI from "@/abis/AeveraVaultABI.json"; 
import { APP_CONFIG } from "@/lib/config"; 

// --- TYPE EXPORTIEREN ---
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

// OPTIMIERUNG: 4000 ist sicher für Base Public Nodes.
// BATCH_SIZE = 5 bedeutet: 5 Anfragen gleichzeitig (Parallelisierung).
const CHUNK_SIZE = 4000n; 
const BATCH_SIZE = 5;

export function MintTable({ capsuleId, isPrivate, onRowClick }: MintTableProps) {
  const [events, setEvents] = useState<MintEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [totalMintedCount, setTotalMintedCount] = useState(0);

  const publicClientRef = useRef(createPublicClient({
      chain: APP_CONFIG.ACTIVE_CHAIN,
      transport: http(APP_CONFIG.PUBLIC_RPC_URL)
  }));

  const isPollingRef = useRef(false);

  // Design-System (Unverändert)
  const highlightColor = isPrivate ? "text-purple-400" : "text-cyan-400";
  const badgeBg = isPrivate ? "bg-purple-500/10" : "bg-cyan-500/10";
  const badgeBorder = isPrivate ? "border-purple-500/20" : "border-cyan-500/20";

  // 1. Wir holen 'sealedAt' (Index 6)
  const { data: capsuleData } = useReadContract({
    address: APP_CONFIG.CONTRACT_ADDRESS as `0x${string}`,
    abi: AeveraVaultABI,
    functionName: "capsules",
    args: [capsuleId],
  });

  const capsuleDataArray = capsuleData as any[] | undefined;
  const shortId = capsuleDataArray ? capsuleDataArray[2] : "...";
  // 'sealedAt' ist unser Anker für die Zeit und den Startblock
  const sealedAt = capsuleDataArray ? Number(capsuleDataArray[6]) : 0;

  // MAIN FETCH FUNCTION (Turbo-Modus: Parallel Batching)
  const fetchSmartHistory = async (isBackgroundUpdate = false) => {
      const client = publicClientRef.current;
      // WICHTIG: Wir warten, bis wir 'sealedAt' haben, sonst suchen wir blind
      if (!client || isPollingRef.current || !sealedAt) return;

      isPollingRef.current = true; // Lock

      if (!isBackgroundUpdate) {
          setIsLoading(true);
          setError(null);
          setStatusMsg("Initializing Turbo Sync...");
      }

      try {
        const filterId = BigInt(capsuleId);
        const currentBlock = await client.getBlockNumber();

        // 1. Startblock berechnen
        const now = Math.floor(Date.now() / 1000);
        const ageSeconds = now - sealedAt;
        const estimatedBlockDiff = BigInt(Math.floor(ageSeconds / 2)) + 1000n; // Puffer

        let startBlock = currentBlock - estimatedBlockDiff;
        if (startBlock < 0n) startBlock = 0n;

        // 2. Alle benötigten Bereiche (Ranges) im Voraus berechnen
        const ranges = [];
        let cursor = startBlock;
        while (cursor <= currentBlock) {
            let end = cursor + CHUNK_SIZE;
            if (end > currentBlock) end = currentBlock;
            ranges.push({ from: cursor, to: end });
            cursor = end + 1n;
        }

        if (!isBackgroundUpdate) setStatusMsg(`Syncing ${ranges.length} segments...`);

        let allLogs: any[] = [];

        // 3. BATCH PROCESSING (Der Turbo)
        for (let i = 0; i < ranges.length; i += BATCH_SIZE) {
            const batch = ranges.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(
                batch.map(async (range) => {
                    return Promise.all([
                        client.getLogs({
                            address: APP_CONFIG.CONTRACT_ADDRESS as `0x${string}`,
                            event: parseAbiItem('event CapsuleCreated(uint256 indexed id, string uuid, string shortId, address indexed author)'),
                            args: { id: filterId }, 
                            fromBlock: range.from,
                            toBlock: range.to
                        }),
                        client.getLogs({
                            address: APP_CONFIG.CONTRACT_ADDRESS as `0x${string}`,
                            event: parseAbiItem('event CapsuleMinted(uint256 indexed id, address indexed minter, uint256 amount)'),
                            args: { id: filterId },
                            fromBlock: range.from,
                            toBlock: range.to
                        })
                    ]);
                })
            );

            for (const [genesisLogs, mintLogs] of batchResults) {
                allLogs.push(
                    ...genesisLogs.map(l => ({ ...l, _type: "GENESIS" })), 
                    ...mintLogs.map(l => ({ ...l, _type: "COPY" }))
                );
            }

            if (!isBackgroundUpdate && ranges.length > 10) {
                 setStatusMsg(`Syncing... ${(Math.min((i + BATCH_SIZE) / ranges.length * 100, 100)).toFixed(0)}%`);
            }
        }

        // --- DATEN VERARBEITEN ---
        const genesisEvent = allLogs.find(l => l._type === "GENESIS");
        const genesisBlockNumber = genesisEvent ? genesisEvent.blockNumber : startBlock;

        const rawEvents = allLogs.map((log: any) => {
            // FIX: Wir stellen sicher, dass alle Operatoren BigInt sind
            const blockNum = BigInt(log.blockNumber);
            const genBlockNum = BigInt(genesisBlockNumber);
            const blockDiff = blockNum - genBlockNum;

            // FIX: Zeile 153 - Explizites BigInt Casting für die Berechnung
            const estimatedTimestamp = BigInt(sealedAt) + (blockDiff * 2n);

            const amount = log._type === "GENESIS" ? 1 : Number(log.args.amount || 1);

            return {
                txHash: log.transactionHash,
                minter: log._type === "GENESIS" ? log.args.author : log.args.minter,
                timestamp: estimatedTimestamp,
                type: log._type as "GENESIS" | "COPY",
                amount: amount,
                blockNumber: log.blockNumber,
                logIndex: log.logIndex,
            };
        });

        // Sortieren
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
        if(error) setError(null);

      } catch (err: any) {
        console.error("Fetch Error:", err);
        if(!isBackgroundUpdate) {
             setError("Network busy. Retrying...");
        }
      } finally {
        setIsLoading(false);
        isPollingRef.current = false; // Unlock
      }
  };

  useEffect(() => {
    fetchSmartHistory(); 
    const interval = setInterval(() => {
        if (!isPollingRef.current) fetchSmartHistory(true); 
    }, 10000);
    return () => clearInterval(interval);
  }, [capsuleId, sealedAt]); 

  const formatDate = (timestamp: bigint) => {
    if (!timestamp) return "-";
    return new Date(Number(timestamp) * 1000).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC'
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
                                    <td className="py-4 px-6">
                                        <span className={cn("font-mono text-sm font-bold", highlightColor)}>
                                            #{shortId}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-1.5 text-sm text-white font-bold font-mono">
                                            <Layers className="w-3 h-3 text-slate-500" />
                                            {mint.amount}
                                        </div>
                                    </td>
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
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-2 font-mono text-sm text-slate-300">
                                            <User className="w-3 h-3 text-slate-500" />
                                            <span className="group-hover:text-white transition-colors">
                                                {mint.minter.startsWith("0x") 
                                                    ? `${mint.minter.slice(0, 6)}...${mint.minter.slice(-4)}` 
                                                    : mint.minter}
                                            </span>
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
                                    <td className="py-4 px-6 text-sm text-slate-400">
                                        {formatDate(mint.timestamp)}
                                    </td>
                                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                        <a 
                                          href={`${APP_CONFIG.EXPLORER_URL}/tx/${mint.txHash}`}
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