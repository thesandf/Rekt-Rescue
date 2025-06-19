# RektRescue Documentation

## 🔍 Overview

**RektRescue** is a DeFi safety tool built to help users detect and revoke risky token approvals and clean up dust tokens. It focuses on improving wallet hygiene by:

* Scanning **ERC-20** and **ERC-721** approvals
* Highlighting dangerous or outdated approvals
* Enabling one-click **Revoke** actions
* Identifying small or "dust" balances for cleanup

---

## 🎯 Objectives

* Detect all approval events for ERC-20 and ERC-721 tokens
* Display clear, actionable data:

  * Block
  * TxHash
  * Event (Approval / ApprovalForAll)
  * Token
  * Owner
  * Spender
  * Amount / Token ID
* Allow users to revoke approvals easily
* Identify and surface low-value (dust) tokens in the wallet

---

## 🧰 Tech Stack

* **Frontend**: Next.js, TypeScript, Tailwind CSS, ShadCN UI
* **Wallet Integration**: Viem, WalletConnect
* **Blockchain Interaction**: Viem for log scanning and transaction calls

---

## 🔐 Supported Standards

* **ERC-20**: `Approval` event, `approve(spender, 0)`
* **ERC-721**: `Approval` and `ApprovalForAll` events, `setApprovalForAll(spender, false)`

---

## 📊 UI Components

### 🔗 Token Approval Scanner

Scans the blockchain for recent approval events related to the connected wallet and displays them in a table:

| Block    | TxHash      | Event                 | Token | Owner      | Spender         | Amount / TokenId | Revoke    |
| -------- | ----------- | --------------------- | ----- | ---------- | --------------- | ---------------- | --------- |
| 19743812 | 0xabc...123 | ERC20 Approval        | USDC  | 0xMe...123 | 0xSpender...456 | MaxUint256       | 🔘 Revoke |
| 19743845 | 0xdef...456 | ERC721 ApprovalForAll | BAYC  | 0xMe...123 | 0xSpender...789 | true             | 🔘 Revoke |

> Clicking **Revoke**:

* For ERC-20: calls `approve(spender, 0)`
* For ERC-721: calls `setApprovalForAll(spender, false)`

---

### 🧹 Dust Token Scanner

Identifies tokens in the wallet with balances below a defined threshold (e.g., `< 0.01` tokens or `< $0.01` value):

| Token | Balance | USD Value | Action  |
| ----- | ------- | --------- | ------- |
| DAI   | 0.0045  | \~\$0.004 | 🔘 Hide |
| LINK  | 0.0021  | \~\$0.01  | 🔘 Hide |

> This helps declutter wallets from negligible tokens and enhances UX on wallets and portfolio trackers.

---

## 🚀 Roadmap

* ✅ ERC-20 Approval Detection
* ✅ ERC-721 Approval & ApprovalForAll Scanner
* ✅ One-click Revoke Support
* ✅ Dust Token Display
* 🔜 Token logos and labels in approval table
* 🔜 Risk scoring for spender addresses
* 🔜 Mobile layout and PWA support

---

## 💡 Future Enhancements

* 🛡️ Spender risk classification (e.g., flagged by security firms)
* 📬 Notifications for dangerous approvals
* 🔍 Multi-chain support: Ethereum, Arbitrum, Polygon, BNB, Base
* 🧠 AI-powered spender reputation insights

---

## 🙌 Credits

* Inspired by **Revoke.cash**, **TxFusion**, and real-world user issues
* Built to empower users with better control over their wallets

---

## 📬 Contact

* **GitHub**: [thesandf](https://github.com/thesandf)
* **Twitter/X**: [@THE\_SANDF](https://x.com/THE_SANDF)

---
