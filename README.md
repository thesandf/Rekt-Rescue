# RektRescue Documentation

##  Overview

**RektRescue** is a DeFi safety tool built to help users detect and revoke risky token approvals and clean up dust tokens. It focuses on improving wallet hygiene by:

* Scanning **ERC-20** and **ERC-721** approvals
* Protocol Risk Scanner
* Highlighting dangerous or outdated approvals
* Enabling one-click **Revoke** actions
* Identifying small or "dust" balances for cleanup

---

##  Objectives

* Detect all approval events for ERC-20 and ERC-721 tokens
* Display clear, actionable data:

  * Block
  * TxHash
  * Event (Approval / ApprovalForAll)
  * Token ERC-20 and ERC-721
  * Owner
  * Spender
  * Amount / Token ID
* Allow users to revoke approvals easily
* Identify and surface low-value (dust) tokens in the wallet

---

##  Tech Stack

* **Frontend**: Next.js, TypeScript, Tailwind CSS, ShadCN UI
* **Wallet Integration**: Viem, WalletConnect
* **Blockchain Interaction**: Viem for log scanning and transaction calls

---

##  Supported Standards

* **ERC-20**: `Approval` event, `approve(spender, 0)`
* **ERC-721**: `Approval` and `ApprovalForAll` events, `setApprovalForAll(spender, false)`

---

##  UI Components

###  Token Approval Scanner

Scans the blockchain for recent approval events related to the connected wallet and displays them in a table:

| Block    | TxHash      | Event                 | Token | Owner      | Spender         | Amount / TokenId | Revoke    |
| -------- | ----------- | --------------------- | ----- | ---------- | --------------- | ---------------- | --------- |
| 19743812 | 0xabc...123 | ERC20 Approval        | USDC  | 0xMe...123 | 0xSpender...456 | MaxUint256       |  Revoke |
| 19743845 | 0xdef...456 | ERC721 ApprovalForAll | BAYC  | 0xMe...123 | 0xSpender...789 | true             |  Revoke |

> Clicking **Revoke**:

* For ERC-20: calls `approve(spender, 0)`
* For ERC-721: calls `setApprovalForAll(spender, false)`

---

###  Dust Token Scanner

Identifies tokens in the wallet with balances below a defined threshold (e.g., `< 0.01` tokens or `< $0.01` value):

| Token | Balance | USD Value |
| ----- | ------- | --------- |
| DAI   | 0.0045  | \~\$0.004 |
| LINK  | 0.0021  | \~\$0.01  | 

> This helps declutter wallets from negligible tokens and enhances UX on wallets and portfolio trackers.

---

Here’s clean and complete **documentation** for your `ProtocolRiskScanner` React component. This covers purpose, props, behavior, usage, and developer notes.

---

#  ProtocolRiskScanner Component Docs

`ProtocolRiskScanner` is a React client component built with Wagmi and Viem that analyzes the **DeFi health and protocol exposure** of a wallet address across Aave, Compound, and Uniswap on multiple EVM-compatible networks.

It scans for:

* Risky Aave positions (via Health Factor)
* Undercollateralized Compound positions (via Shortfall)
* Unused Uniswap LP NFTs (via `balanceOf`)

---

##  Features

*  **Auto or manual address scanning**
*  **Auto-detect connected wallet**
*  **Reads live data from smart contracts**
*  **Fully responsive Tailwind UI**
*  Supports Ethereum, Sepolia, Arbitrum, Polygon, Base

---

##  Props

**None.** This component does not accept any props—it uses Wagmi hooks internally to detect wallet and network.

---

##  Component Structure

```tsx
<ProtocolRiskScanner />
```

---

##  Internal Logic

| Protocol | Method Used                    | Risk Metric                             |
| -------- | ------------------------------ | --------------------------------------- |
| Aave     | `getUserAccountData(address)`  | Health Factor (`< 1.1` = risky)         |
| Compound | `getAccountLiquidity(address)` | Shortfall (`> 0` = undercollateralized) |
| Uniswap  | `balanceOf(address)`           | LP NFT presence                         |

---

##  Usage Behavior

### Input:

* Optional wallet address input.
* If empty, defaults to connected wallet.
* If not connected, defaults to `0x000...000`.

### Output:

* Result displayed in a formatted `<pre>` block.
* Each protocol section shows status: Healthy, Risky, or Inactive.

---

##  Supported Chains

| Chain    | Chain ID   |
| -------- | ---------- |
| Ethereum | `1`        |
| Sepolia  | `11155111` |
| Arbitrum | `42161`    |
| Polygon  | `137`      |
| Base     | `8453`     |

Each chain includes hardcoded protocol contract addresses.

---

##  Dev Notes

* All contract interactions are `read-only` and use `publicClient.readContract`.
* A fallback is set to Sepolia if an unsupported chain is detected.
* Health Factor is considered risky below `1.1` for Aave.
* Error handling is silent for each individual protocol read (so failure of one doesn’t break the others).

---

##  Example: Embedding

```tsx
import ProtocolRiskScanner from "@/components/ProtocolRiskScanner";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <ProtocolRiskScanner />
    </div>
  );
}
```

---

##  Future Improvements

* Add token-level risk detail for Aave/Compound.
* Enable revoke or rescue actions directly.
* Animate scan progress or add protocol logos.
* Support more protocols like Maker, Curve, or Pendle.

---

##  Roadmap

* ✅ ERC-20 Approval Detection
* ✅ ERC-721 Approval & ApprovalForAll Scanner
* ✅ One-click Revoke Support
* ✅ Dust Token Display
* ✅ Protocol Risk Scanner
* 🔜 Token logos and labels in approval table
* 🔜 Risk scoring for spender addresses
* 🔜 Mobile layout and PWA support

---

##  Future Enhancements

*  Spender risk classification (e.g., flagged by security firms)
*  Notifications for dangerous approvals
*  Multi-chain support: Ethereum, Arbitrum, Polygon, BNB, Base
*  AI-powered spender reputation insights

---

##  Credits

* Inspired by **Revoke.cash**, **TxFusion**, and real-world user issues
* Built to empower users with better control over their wallets

---

##  Contact

* **GitHub**: [thesandf](https://github.com/thesandf)
* **Twitter/X**: [@THE\_SANDF](https://x.com/THE_SANDF)

---
