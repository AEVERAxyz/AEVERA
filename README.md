# AEVERA Protocol

![Banner](https://aevera.xyz/og-image.png)

> **"A legacy that transcends generations. The persistence of your message in digital infinity."**

[![Base Network](https://img.shields.io/badge/Network-Base_Mainnet-blue)](https://base.org)
[![Contract Verified](https://img.shields.io/badge/Contract-Verified-success)](https://basescan.org/address/0xCa6a0b15ffB34680B5035A14B27909D134E07287)
[![Read Manifesto](https://img.shields.io/badge/Medium-Read_Manifesto-black?logo=medium)](https://medium.com/@AEVERAxyz/aevera-protocol-for-the-beyond-65323f68b6ba)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## ⏳ About AEVERA
AEVERA is a decentralized protocol designed to send encrypted messages into the future. It utilizes **Time-Lock Encryption (Identity-Based Encryption)** via the **Drand Network** to ensure that data remains mathematically inaccessible until a specific future timestamp ("The Era of Reveal").

Unlike traditional "dead man switches" or scheduled emails, AEVERA relies on **0% Trust**. There is no backend database. The entire logic lives on the Base Blockchain.

### 📜 The Manifesto
Why did we build this? Understanding the philosophy of *Aevum* and *Era* is crucial to understanding the protocol.
👉 **[Read the Official Protocol Manifesto on Medium](https://medium.com/@AEVERAxyz/aevera-protocol-for-the-beyond-65323f68b6ba)**

---

## 🔐 Security & Architecture

### Double-Layer Onion Encryption 🧅
To guarantee privacy and security, AEVERA employs a hybrid encryption standard:
1.  **Layer 1 (Client-Side):** AES-256 encryption of the payload.
2.  **Layer 2 (Time-Lock):** The AES key is sealed using `tlock-js` (IBE) against the Drand League of Entropy.

### The Hybrid Smart-Architecture
* **Storage:** IPFS (via Pinata) for encrypted blobs.
* **Logic:** Solidity Smart Contract on Base (L2).
* **Identity:** Integration of ENS and Basenames via Alchemy.

---

## ✅ Identity & Trust Proof
We believe in radical transparency. The protocol deployer identity is verifiable on-chain:

| Proof Type | Verification Status |
| :--- | :--- |
| **ENS** | `aevera.eth` ✅ |
| **Basename** | `aevera.base.eth` ✅ |
| **KYC** | Coinbase Onchain ID Verified ✅ |
| **Contract** | [View on BaseScan](https://basescan.org/address/0xCa6a0b15ffB34680B5035A14B27909D134E07287) |

---

## 🛠 Tech Stack

* **Blockchain:** Base (Coinbase L2)
* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS / Framer Motion
* **Cryptography:** `tlock-js`, `crypto-js`, `viem`
* **Infrastructure:** Alchemy, Pinata

---

## 🔗 Links

* **DApp:** [https://aevera.xyz](https://aevera.xyz)
* **Medium:** [Protocol Manifesto](https://medium.com/@AEVERAxyz/aevera-protocol-for-the-beyond-65323f68b6ba)
* **Block Explorer:** [BaseScan](https://basescan.org/address/0xCa6a0b15ffB34680B5035A14B27909D134E07287)

---

*Secure your legacy. Seal it on Base.*