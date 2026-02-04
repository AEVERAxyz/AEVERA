import React from "react";
// Stelle sicher, dass diese Imports zu deiner Ordnerstruktur passen:
import { Header } from "@/components/Header"; 
import { Footer } from "@/components/Footer"; 
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, Code2, Cpu } from "lucide-react";

export default function DeveloperDetail() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 md:p-8 bg-[#050A15] font-sans">
      <Header />

      <main className="w-full max-w-4xl mt-12 flex flex-col gap-8">

        {/* HERO SECTION */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs font-mono tracking-widest uppercase">
            <Cpu size={14} /> Agentic Protocol Interface
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white font-display tracking-tight">
            Build for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Machine Economy</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            AEVERA is designed to be used by humans and autonomous agents alike. 
            Direct interaction with the smart contract requires client-side encryption.
          </p>
        </div>

        {/* WARNING CARD */}
        <Card className="bg-yellow-950/10 border-yellow-600/30">
            <CardContent className="p-6 flex gap-4 items-start">
                <ShieldAlert className="text-yellow-500 shrink-0 mt-1" size={24} />
                <div>
                    <h3 className="text-yellow-500 font-bold text-lg mb-1">Security Notice for Direct Interaction</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Smart Contracts are transparent by nature. If you interact directly with the <code className="bg-black/30 px-1 py-0.5 rounded text-yellow-200">engrave</code> function via BaseScan or scripts without encrypting your payload first, 
                        your message will be permanently visible in <strong>plaintext</strong>. 
                        <br/><br/>
                        <strong>Use the SDK below to encrypt before sending.</strong>
                    </p>
                </div>
            </CardContent>
        </Card>

        {/* THE SCRIPT SECTION */}
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-xl">
                <Code2 className="text-blue-400" /> 
                <h2>The Agent SDK (Node.js)</h2>
            </div>

            <div className="bg-[#0e1424] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                    <span className="text-xs text-slate-500 font-mono">agent-encrypt.js</span>
                    <span className="text-xs text-slate-500 font-mono">v2.1.0</span>
                </div>
                <div className="p-6 overflow-x-auto">
<pre className="text-xs md:text-sm font-mono text-blue-100 leading-relaxed">
{`// 1. INSTALL DEPENDENCIES
// npm install tlock-js viem

const { timelockEncrypt, roundAt } = require("tlock-js");
const { createWalletClient, http, parseEther, stringToHex } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");
const { baseSepolia } = require("viem/chains");

// CONFIGURATION
const GATEWAY_ADDRESS = "0x08E8b27d08b4F2B0a6A4b3ca5cFCD9FD0DcCDf11"; // AEVERA Proxy
const CHAIN_HASH = "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971"; // Drand Mainnet
const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY; 

async function engraveAgentMessage(text, authorName) {
    if (!PRIVATE_KEY) throw new Error("Private Key missing");

    const account = privateKeyToAccount(PRIVATE_KEY);
    const client = createWalletClient({ 
        account, 
        chain: baseSepolia, 
        transport: http() 
    });

    console.log("🤖 Agent initialized:", account.address);

    // STEP A: GENERATE IDs
    const uuid = crypto.randomUUID();
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // STEP B: ENCRYPT (Client Side!)
    // NOTE: This example uses Time-Lock encryption.
    // If you want Password-Encryption (isPrivate: true), use AES here instead of timelockEncrypt.

    console.log("🔒 Encrypting payload...");
    const response = await fetch(\`https://api.drand.sh/\${CHAIN_HASH}/info\`);
    const chainInfo = await response.json();

    // Unlock in 1 hour
    const unlockTime = Math.floor(Date.now() / 1000) + 3600; 
    const round = roundAt(unlockTime * 1000, chainInfo);

    const ciphertext = await timelockEncrypt(
        round, 
        new TextEncoder().encode(text),
        { chain: { info: async () => chainInfo } }
    );

    // STEP C: PREPARE PAYLOAD
    const contentPayload = JSON.stringify(ciphertext);

    // STEP D: SEND TO BLOCKCHAIN
    console.log("🚀 Sending transaction to Base...");

    // PAYMENT NOTE: 
    // - To pay with ETH: Send value (e.g. 0.000777 ETH) and payWithUSDC: false
    // - To pay with USDC: Approve contract first, send value: 0, and payWithUSDC: true

    const hash = await client.writeContract({
        address: GATEWAY_ADDRESS,
        abi: [
            {
                name: 'engrave',
                type: 'function',
                stateMutability: 'payable',
                inputs: [
                    { name: 'to', type: 'address' },
                    {
                        name: 'data',
                        type: 'tuple',
                        components: [
                            { name: 'uuid', type: 'string' },
                            { name: 'shortId', type: 'string' },
                            { name: 'author', type: 'string' },
                            { name: 'content', type: 'bytes' },
                            { name: 'unlockTime', type: 'uint40' },
                            { name: 'isPrivate', type: 'bool' }
                        ]
                    },
                    { name: 'payWithUSDC', type: 'bool' }
                ],
                outputs: [{ name: '', type: 'uint256' }]
            }
        ],
        functionName: 'engrave',
        args: [
            account.address, // 'to'
            {
                uuid: uuid,
                shortId: shortId,
                author: authorName,
                content: stringToHex(contentPayload),
                unlockTime: BigInt(unlockTime),
                isPrivate: false // Set TRUE if using Password Encryption (AES)
            },
            false // Set TRUE to pay with USDC
        ],
        value: parseEther("0.000777") // Set to 0 if paying with USDC
    });

    console.log("✅ Capsule Engraved! Hash:", hash);
    console.log("🔗 View: https://aevera.xyz/capsule/" + shortId);
}

// EXECUTE
engraveAgentMessage("Hello from an Autonomous Agent 🤖", "Agent-007");`}
</pre>
                </div>
            </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}