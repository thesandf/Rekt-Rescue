"use client";
import React, { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePublicClient } from "wagmi";
import { formatUnits, zeroAddress } from "viem";

type SupportedChainId = 1 | 11155111 | 42161 | 137 | 8453;

const addresses: Record<
  SupportedChainId,
  {
    label: string;
    AAVE_POOL: string;
    COMPOUND_COMET: string;
    UNISWAP_NFT_MANAGER: string;
  }
> = {
  1: {
    label: "Ethereum Mainnet",
    AAVE_POOL: "0x7BeA39867e4169DBe237d55C8242a8f2fcDcc387",
    COMPOUND_COMET: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    UNISWAP_NFT_MANAGER: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  11155111: {
    label: "Sepolia ",
    AAVE_POOL: "0xC9A2c7A7e7e1e1e1e1e1e1e1e1e1e1e1e1e1",
    COMPOUND_COMET: "0x3EE77595A8459e93C2888b13aDB354017B198188",
    UNISWAP_NFT_MANAGER: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  42161: {
    label: "Arbitrum",
    AAVE_POOL: "0xC13e21b648A5F5Ff6e4C93504A1Ae1c234f69E10",
    COMPOUND_COMET: "0x593cBc4fF1A50c259d6aB4F5f3Ce30bC73A8D3A0",
    UNISWAP_NFT_MANAGER: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  137: {
    label: "Polygon",
    AAVE_POOL: "0xAAAEBE6Fe48E54f431b0C390Cfaf9A29bAF0cE8d",
    COMPOUND_COMET: "0xA34737Ffba2E5644Df7cD2CfE82C3a3f26dB42A1",
    UNISWAP_NFT_MANAGER: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
  8453: {
    label: "Base",
    AAVE_POOL: "0xA56f9f200Dd369bD308730C19626b4378c3F0cB0",
    COMPOUND_COMET: "0xFDECEa2B42a733d5b5c0E5C1786B63E387A4eF2B",
    UNISWAP_NFT_MANAGER: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  },
};

const AAVE_POOL_ABI = [
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserAccountData",
    outputs: [
      { internalType: "uint256", name: "totalCollateralETH", type: "uint256" },
      { internalType: "uint256", name: "totalDebtETH", type: "uint256" },
      { internalType: "uint256", name: "availableBorrowsETH", type: "uint256" },
      {
        internalType: "uint256",
        name: "currentLiquidationThreshold",
        type: "uint256",
      },
      { internalType: "uint256", name: "ltv", type: "uint256" },
      { internalType: "uint256", name: "healthFactor", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const COMPOUND_COMET_ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getAccountLiquidity",
    outputs: [
      { internalType: "uint256", name: "err", type: "uint256" },
      { internalType: "uint256", name: "liquidity", type: "uint256" },
      { internalType: "uint256", name: "shortfall", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const UNISWAP_NFT_MANAGER_ABI = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];

const ProtocolRiskScanner: React.FC = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const chain = addresses[chainId as SupportedChainId] || addresses[11155111]; // fallback = Sepolia
  const [address, setAddress] = useState("");
  const [riskReport, setRiskReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scanAddress = address || connectedAddress || zeroAddress;

  const handleScan = async () => {
    setLoading(true);
    setRiskReport(null);

    if (!publicClient) {
      setRiskReport("❌ No public client available.");
      setLoading(false);
      return;
    }

    try {
      let aaveResult = "Aave: N/A";
      let compoundResult = "Compound: N/A";
      let uniswapResult = "Uniswap: N/A";

      try {
        const aaveData = (await publicClient.readContract({
          address: chain.AAVE_POOL as `0x${string}`,
          abi: AAVE_POOL_ABI,
          functionName: "getUserAccountData",
          args: [scanAddress],
        })) as [bigint, bigint, bigint, bigint, bigint, bigint];

        const health = Number(formatUnits(aaveData[5], 18));
        aaveResult =
          health < 1.1
            ? `⚠️ Aave: Liquidation risk. Health Factor: ${health.toFixed(2)}`
            : ` Aave: Healthy. Health Factor: ${health.toFixed(2)}`;
      } catch {}

      try {
        const compoundData = (await publicClient.readContract({
          address: chain.COMPOUND_COMET as `0x${string}`,
          abi: COMPOUND_COMET_ABI,
          functionName: "getAccountLiquidity",
          args: [scanAddress],
        })) as [bigint, bigint, bigint];

        const shortfall = compoundData[2];
        const liquidity = compoundData[1];

        compoundResult =
          shortfall > 0n
            ? "⚠️ Compound: Undercollateralized!"
            : liquidity > 0n
            ? " Compound: Healthy."
            : "ℹ Compound: No active position.";
      } catch {}

      try {
        const balance = (await publicClient.readContract({
          address: chain.UNISWAP_NFT_MANAGER as `0x${string}`,
          abi: UNISWAP_NFT_MANAGER_ABI,
          functionName: "balanceOf",
          args: [scanAddress],
        })) as bigint;

        uniswapResult =
          balance > 0n
            ? ` Uniswap: ${balance.toString()} LP NFTs found.`
            : "ℹ Uniswap: No LP positions.";
      } catch {}

      setRiskReport(`${aaveResult}\n${compoundResult}\n${uniswapResult}`);
    } catch {
      setRiskReport("❌ Error scanning protocols.");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 bg-black text-white rounded-lg shadow max-w-xl mx-auto mt-10 border border-white">
      <h2 className="text-3xl font-bold mb-6"> Protocol Risk Scanner</h2>
      <div className="text-sm text-gray-300 mb-6 leading-relaxed">
        <p className="mb-2">
          <strong>Protocol Risk Scanner</strong> is a DeFi wallet health checker
          that scans your address across major protocols to detect risks such
          as:
        </p>
        <ul className="list-disc list-inside pl-2 space-y-1">
          <li>Dangerous or unhealthy Aave and Compound positions</li>
          <li> Unused Uniswap LP positions</li>
          <li>Liquidation risk via health factor and shortfall analysis</li>
        </ul>
        <p className="mt-4">
           <strong>Supported Chains:</strong> Ethereum, Sepolia, Arbitrum,
          Polygon, Base.
        </p>
      </div>

      <input
        className="bg-black text-white border border-white p-3 rounded w-full mb-4 placeholder-white"
        type="text"
        placeholder={
          isConnected ? `Default: ${connectedAddress}` : "Enter wallet address"
        }
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button
        className="bg-white text-black font-semibold px-4 py-2 rounded hover:bg-gray-300 transition"
        onClick={handleScan}
        disabled={loading || !scanAddress}
      >
        {loading ? "Scanning..." : "Scan Protocols"}
      </button>

      {riskReport && (
        <pre className="bg-white text-black mt-6 p-4 rounded whitespace-pre-wrap">
          {riskReport}
        </pre>
      )}

      <p className="text-sm text-gray-400 mt-3">
        {mounted
          ? ` Active Network: ${chain.label}`
          : " Detecting network..."}
      </p>
      {!isConnected && (
        <p className="text-xs text-gray-500 mt-2">
          🔌 Connect your wallet for live data.
        </p>
      )}
    </div>
  );
};

export default ProtocolRiskScanner;
