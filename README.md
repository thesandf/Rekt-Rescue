# RektRescue Documentation

## Overview

**RektRescue** is a DeFi recovery and batch transaction tool designed to help users recover from common mistakes like:

* Stuck tokens
* Over-borrowed positions
* Excessive token approvals
* Forgotten dust assets

It enables users to diagnose and resolve issues across multiple DeFi protocols (Aave, Compound, Uniswap) in one unified interface using a single batched transaction powered by EIP-5792, EIP-3074, and EIP-4337.

---

## Objectives

* Scan wallet for potential risks
* Analyze token approvals, debt positions, unused balances
* Let user plan corrective actions
* Build and simulate batched transactions
* Execute fixes with a single signature using `wallet_sendCalls`

---

## Tech Stack

* **Frontend**: Next.js, TailwindCSS, ShadCN UI, TypeScript
* **Wallet Integration**: Viem with EIP-5792
* **Smart Contracts**: Solidity (RektRescueHelper.sol)
* **Backends (optional)**: Risk analyzer APIs, simulation tools

---

## Supported Standards

* **EIP-5792**: `wallet_sendCalls` — batched wallet execution
* **EIP-3074**: Delegated calls from EOAs
* **EIP-4337**: Account abstraction for SCWs

---

## Architecture Diagram




---

## User Flow

1. **Scan**: App detects risks in Aave, Compound, Uniswap, token approvals
2. **Plan**: User selects recovery actions (revoke, swap, repay, withdraw)
3. **Simulate**: Batch is simulated for gas and success
4. **Sign**: User signs batch using EIP-5792-enabled wallet
5. **Execute**: Transaction is sent to Invoker or Bundler (depending on wallet type)

---

## Key Components

### 1. Recovery UI

* Displays risks and balances
* Lets users choose recovery actions (e.g., revoke, swap, repay)

### 2. Protocol Scanner

* Reads on-chain data from:

  * Aave (positions, debt)
  * Compound
  * Uniswap pools
  * ERC20 allowances

### 3. Risk Analyzer

* Detects:

  * Dangerous approvals
  * Collateral vs borrow ratios
  * Liquidation risks
  * Dust tokens

### 4. Batch Builder

* Builds an array of transaction calls
* Prepares for `wallet_sendCalls`
* Encodes calls to helper contract and targets

### 5. Gas Simulator

* Estimates cost
* Pre-checks success/failure

### 6. RektRescueHelper.sol (Contract)

* Encodes all possible recovery operations
* Only executable via safe batch call
* Verifies permissions and limits

---

## Smart Contract Sketch: RektRescueHelper.sol

```solidity
contract RektRescueHelper {
    function swap(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut) external;
    function repayAave(address pool, address asset, uint256 amount) external;
    function withdrawAave(address pool, address asset, uint256 amount) external;
    function revokeApproval(address token, address spender) external;
    function claimDust(address token) external;
}
```

---

## Batch Example

```js
const calls = [
  {
    to: RektRescueHelperAddress,
    data: encodeFunction("revokeApproval", [USDC, oldSpender])
  },
  {
    to: RektRescueHelperAddress,
    data: encodeFunction("repayAave", [aavePool, DAI, daiDebt])
  }
];

await walletClient.sendCalls({ calls });
```

---

## Roadmap

* [x] Diagram & architecture
* [x] UI prototype
* [ ] Contract implementation
* [ ] Testing batch safety
* [ ] Launch MVP on testnet
* [ ] Community feedback round
* [ ] Submit to hackathons

---

## Future Ideas

* Auto liquidation protection
* Email/SMS alerts for bad positions
* DAO-integrated rescue calls
* Integrate with AA wallets directly

---

## Credits

* Inspired by TxFusion, 1inch revoke tool, and real user pain
* Built with passion for DeFi safety

---

## Contact

You can reach the creator of RektRescue for feedback or collaboration on [GitHub](https://github.com/thesandf), [Twitter],[X](https://x.com/THE_SANDF),.