import { useState, useEffect, useRef } from "react";
import { useReadContract } from "wagmi";
import { Loader2, ExternalLink, User, Layers, RefreshCw } from "lucide-react"; 
import { cn } from "@/lib/utils";
import { parseAbiItem, createPublicClient, http, fallback } from "viem"; 
// UPDATE: V2 ABI Import
import AeveraVaultABI from "@/abis/AeveraEternalVault.json"; 
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

// TUNING FÜR SPEED 🏎️
const CHUNK_SIZE = 10000n; 
const BATCH_SIZE = 5;      

export function MintTable({ capsuleId, isPrivate, onRowClick }: MintTableProps) {
  const [events, setEvents] = useState<MintEventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [totalMintedCount, setTotalMintedCount] = useState(0);

  const publicClientRef = useRef(createPublicClient({
      chain: APP_CONFIG.ACTIVE_CHAIN,
      transport: fallback(
          APP_CONFIG.RPC_LIST.map(url => http(url, { 
              batch: true, 
              timeout: 6000 
          })),
          { rank: true } 
      )
  }));

  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true); 

  // Design
  const highlightColor = isPrivate ? "text-purple-400" : "text-cyan-400";
  const badgeBg = isPrivate ? "bg-purple-500/10" : "bg-cyan-500/10";
  const badgeBorder = isPrivate ? "border-purple-500/20" : "border-cyan-500/20";

  // UPDATE: Adresse auf VAULT_ADDRESS geändert
  const { data: capsuleData } = useReadContract({
    address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`,
    abi: AeveraVaultABI,
    functionName: "capsules",
    args: [capsuleId],
  });

  const capsuleDataArray = capsuleData as any[] | undefined;
  // V2 Indizes: [creator, author, shortId, uuid, sealTime...]
  const shortId = capsuleDataArray ? capsuleDataArray[2] : "...";
  // UPDATE: sealedAt ist jetzt Index 4 (vorher 6)
  const sealedAt = capsuleDataArray ? Number(capsuleDataArray[4]) : 0;

  // --- MAIN FETCH FUNCTION ---
  const fetchSmartHistory = async (isBackgroundUpdate = false) => {
      const client = publicClientRef.current;
      if (!client || isPollingRef.current || !sealedAt) return;

      isPollingRef.current = true; 

      if (!isBackgroundUpdate) {
          setIsLoading(true);
          setError(null);
          setStatusMsg("Connecting to Blockchain...");
      }

      try {
        const filterId = BigInt(capsuleId);
        const currentBlock = await client.getBlockNumber();

        const now = Math.floor(Date.now() / 1000);
        const ageSeconds = now - sealedAt;
        const estimatedBlockDiff = BigInt(Math.floor(ageSeconds / 2)) + 2000n; 

        let startBlock = currentBlock - estimatedBlockDiff;
        if (startBlock < 0n) startBlock = 0n;

        const ranges = [];
        let cursor = startBlock;
        while (cursor <= currentBlock) {
            let end = cursor + CHUNK_SIZE;
            if (end > currentBlock) end = currentBlock;
            ranges.push({ from: cursor, to: end });
            cursor = end + 1n;
        }

        if (!isBackgroundUpdate) setStatusMsg(`Scanning Ledger...`);

        let allLogs: any[] = [];

        // BATCH PROCESSING
        for (let i = 0; i < ranges.length; i += BATCH_SIZE) {
            if (!isMountedRef.current) break;

            const batch = ranges.slice(i, i + BATCH_SIZE);

            try {
                // UPDATE: Wir nutzen jetzt Standard ERC1155 Events (TransferSingle)
                const batchResults = await Promise.all(
                    batch.map(async (range) => {
                        return client.getLogs({
                            address: APP_CONFIG.VAULT_ADDRESS as `0x${string}`,
                            event: parseAbiItem('event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'),
                            args: { 
                                id: filterId,
                                from: '0x0000000000000000000000000000000000000000' // Nur Mints (From Zero)
                            }, 
                            fromBlock: range.from,
                            toBlock: range.to
                        });
                    })
                );

                for (const logs of batchResults) {
                    allLogs.push(...logs);
                }

                if (!isBackgroundUpdate && ranges.length > 10 && i % (BATCH_SIZE * 2) === 0) {
                     const progress = Math.min((i + BATCH_SIZE) / ranges.length * 100, 100);
                     setStatusMsg(`Syncing... ${progress.toFixed(0)}%`);
                }

            } catch (batchError) {
                console.warn("Node busy, switching...", batchError);
                await new Promise(r => setTimeout(r, 1000));
                i -= BATCH_SIZE; 
                continue;
            }
        }

        // --- DATEN VERARBEITEN ---
        // V2 Logik: Alles sind 'TransferSingle' Events.
        const rawEvents = allLogs.map((log: any) => {
            const blockNum = BigInt(log.blockNumber);
            // Grobe Schätzung für Timestamp (besser als gar nichts)
            const estimatedTimestamp = BigInt(sealedAt); 

            // Args: operator, from, to, id, value
            const amount = Number(log.args.value || 1);

            return {
                txHash: log.transactionHash,
                minter: log.args.to, // Empfänger ist der Minter
                timestamp: estimatedTimestamp, // Placeholder, wird oft nicht angezeigt in Tabelle
                type: "COPY", // Wir setzen erst mal alles auf Copy
                amount: amount,
                blockNumber: log.blockNumber,
                logIndex: log.logIndex,
            };
        });

        // Sortieren: Älteste zuerst für Serial Number Berechnung
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

            // V2 GENESIS ERKENNUNG: Das allererste Item (Serial 0) ist das Original
            const finalType = startSerial === 0 ? "GENESIS" : "COPY";

            return {
                ...event,
                type: finalType as "GENESIS" | "COPY",
                startSerial,
                endSerial,
                serialNumber: startSerial 
            };
        });

        if (isMountedRef.current) {
            setTotalMintedCount(runningCounter);
            // Tabelle zeigt neueste zuerst
            setEvents(calculatedEvents.reverse()); 
            setError(null);
        }

      } catch (err: any) {
        console.error("Fetch Error:", err);
        if (isMountedRef.current && !isBackgroundUpdate) {
             if (events.length === 0) {
                 setError("Searching Grid...");
             }
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
        isPollingRef.current = false;
      }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchSmartHistory(); 

    const interval = setInterval(() => {
        if (!isPollingRef.current) fetchSmartHistory(true); 
    }, 15000); 

    return () => {
        isMountedRef.current = false;
        clearInterval(interval);
    };
  }, [capsuleId, sealedAt]); 

  const formatDate = (timestamp: bigint) => {
    if (!timestamp) return "-";
    // Falls Timestamp 0 ist (Fallback), zeigen wir "sealedAt" an oder "-"
    if (timestamp === 0n) return "-";
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
                                        <RefreshCw className="w-5 h-5 mb-1" />
                                        <span className="text-sm font-bold">Network Busy</span>
                                        <span className="text-xs opacity-70">Auto-retrying...</span>
                                        <button 
                                            onClick={() => fetchSmartHistory(false)}
                                            className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs transition-colors"
                                        >
                                            Retry Now
                                        </button>
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