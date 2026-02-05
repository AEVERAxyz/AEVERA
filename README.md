# AEVERA Protocol

![Banner](https://aevera.xyz/og-image.png)

> **"A legacy that transcends generations. The persistence of your message in digital infinity."**

[![Base Network](https://img.shields.io/badge/Network-Base_Mainnet-blue)](https://base.org)
[![Contract Verified](https://img.shields.io/badge/Contract-Verified-success)](https://basescan.org/address/0xC626463650C39653b09DCcD33158F15419cf24ae)
[![Architecture](https://img.shields.io/badge/Architecture-V2_Hub_&_Spoke-purple)](https://github.com/AEVERAxyz/AEVERA)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## ⏳ About AEVERA
AEVERA is a decentralized protocol designed to send encrypted messages into the future. It utilizes **Time-Lock Encryption (Identity-Based Encryption)** via the **Drand Network** to ensure that data remains mathematically inaccessible until a specific future timestamp ("The Era of Reveal").

Unlike traditional "dead man switches" or scheduled emails, AEVERA relies on **0% Trust**. There is no backend database for message storage. The entire logic lives on the Base Blockchain.

### 📜 The Manifesto
Why did we build this? Understanding the philosophy of *Aevum* and *Era* is crucial to understanding the protocol.
👉 **[Read the Official Protocol Manifesto on Medium](https://medium.com/@AEVERAxyz/aevera-protocol-for-the-beyond-65323f68b6ba)**

---

## 🏛️ V2 Architecture & Storage ("The Engraving")

With the release of Protocol V2, AEVERA has moved to a fully on-chain architecture.

### 1. Storage: SSTORE2 (No IPFS)
We no longer rely on IPFS or external storage providers. AEVERA uses **SSTORE2 (EIP-2470)** to write encrypted payloads directly into the **EVM Bytecode** of the Base Blockchain.
* **Why?** To guarantee true immutability. As long as Ethereum/Base exists, your data exists.
* **The Engraving:** Your message is not just a log; it is part of the chain's code history.

### 2. Hub-and-Spoke Smart Contracts
The system is split into three specialized organs to ensure security and upgradeability:
* **The Vault (AeveraEternalVault):** Immutable storage. Holds the data pointers and enforces "Iron Laws" (Time-Locks, Uniqueness).
* **The Gateway (AeveraGateway):** The logic layer. Handles payments, batching, and strict privacy checks.
* **The Visuals (AeveraVisuals):** An external library that generates the On-Chain SVG artwork.

---

## 🔐 Security & Identity Guard

### Double-Layer Onion Encryption 🧅
To guarantee privacy, AEVERA employs a hybrid encryption standard:
1.  **Layer 1 (Client-Side):** AES-256 encryption of the payload.
2.  **Layer 2 (Time-Lock):** The AES key is sealed using `tlock-js` (IBE) against the Drand League of Entropy.

### Identity Guard (EIP-712)
AEVERA enforces strict identity verification.
* Users cannot simply "claim" a name.
* The protocol uses an **Off-Chain Oracle (Identity Guard)** that verifies ownership of ENS (`.eth`) or Basenames (`.base.eth`).
* The Smart Contract rejects any engraving attempt without a valid cryptographic signature from the Identity Guard.

---

## 🛠 Tech Stack

* **Blockchain:** Base (Coinbase L2)
* **Smart Contracts:** Solidity (OpenZeppelin, Solady for SSTORE2)
* **Frontend:** React / Vite / TypeScript (Static dApp)
* **Cryptography:** `tlock-js` (Drand), `viem`
* **Infrastructure:** Vercel (Hosting & Serverless Signing), Alchemy (RPC)

---

## 📜 Verified Contracts (Base Mainnet)

| Contract | Address |
| :--- | :--- |
| **Gateway Proxy** (Interact here) | [`0xC626463650C39653b09DCcD33158F15419cf24ae`](https://basescan.org/address/0xC626463650C39653b09DCcD33158F15419cf24ae) |
| **Eternal Vault** (Storage) | [`0x0C718C8f4F851F7e6dF0F2DE1e5Ac15CC3585F15`](https://basescan.org/address/0x0C718C8f4F851F7e6dF0F2DE1e5Ac15CC3585F15) |
| **Visuals** (Renderer) | [`0x6Ee1D7233d78E3227D00EAe049060cC6d3D4F32b`](https://basescan.org/address/0x6Ee1D7233d78E3227D00EAe049060cC6d3D4F32b) |

---

## 🔗 Links

* **DApp:** [https://aevera.xyz](https://aevera.xyz)
* **Twitter/X:** [@AEVERAxyz](https://twitter.com/AEVERAxyz)
* **Farcaster:** [@aevera](https://warpcast.com/aevera)

---

*Secure your legacy. Seal it on Base.*