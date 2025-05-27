"use client";

import React, { useState } from "react";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { formatUnits } from "viem";
import { getExplorerUrl } from "../utils/explorerUtils";

const erc20Abi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
];

const ETHERSCAN_API_KEY = process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || ""; // put your key in .env.local
const ETHERSCAN_API = "https://api-sepolia.etherscan.io/api";

type Address = `0x${string}`;

export default function DustScanner() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const [dustTokens, setDustTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanDust = async () => {
    if (!address || !publicClient) return;
    setLoading(true);
    setError(null);

    try {
      const url = `${ETHERSCAN_API}?module=account&action=tokentx&address=${address}&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== "1") {
        throw new Error(data.message || "No token transfers found.");
      }

      const transfers = data.result;

      // Unique token contracts from transfers
      const uniqueTokens = Array.from(
        new Map(
          transfers.map((tx: any) => [
            tx.contractAddress.toLowerCase(),
            {
              address: tx.contractAddress as Address,
            },
          ])
        ).values()
      );

      const tokensWithData = await Promise.all(
        uniqueTokens.map(async (token: any) => {
          try {
            // Fix: Promise.all expects an array, not a trailing comma or parenthesis
            const [balance, decimals, symbol, name] = await Promise.all([
              publicClient.readContract({
                address: token.address as Address,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [address],
              }),
              publicClient.readContract({
                address: token.address as Address,
                abi: erc20Abi,
                functionName: "decimals",
              }),
              publicClient.readContract({
                address: token.address as Address,
                abi: erc20Abi,
                functionName: "symbol",
              }),
              publicClient
                .readContract({
                  address: token.address as Address,
                  abi: erc20Abi,
                  functionName: "name",
                })
                .catch(() => "-"), // fallback if name() is not implemented
            ]);

            return {
              address: token.address as Address,
              balance: balance as bigint,
              decimals: decimals as number,
              symbol: symbol as string,
              name: name as string,
            };
          } catch (err) {
            console.warn(`Error reading token: ${(token as any).address}`, err);
            return null;
          }
        })
      );

      const filtered = tokensWithData
        .filter((t) => t !== null)
        .filter((t) => Number(formatUnits(t!.balance, t!.decimals)) > 0);

      setDustTokens(filtered as any[]);
    } catch (err: any) {
      console.error("Scan error:", err);
      setError("Failed to scan for tokens");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="p-4 mx-auto bg-black rounded-lg shadow mt-6 border border-neutral-700"
      style={{ width: "80vw", height: "50vh", minWidth: 320, minHeight: 320 }}
    >
      <h2 className="text-xl font-semibold mb-4 text-white">Dust Token Scanner</h2>
      <div className="flex items-center justify-center">
  <div className="relative group">
    <button
      onClick={scanDust}
      disabled={loading}
      className="relative inline-block p-px font-medium leading-6 text-white bg-gray-800 cursor-pointer rounded-xl shadow-2xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 disabled:opacity-50"
    >
      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>

      <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
        <div className="relative z-10 flex items-center space-x-2">
          <span className="transition-all duration-500 group-hover:translate-x-1">
            {loading ? "Scanning..." : "Scan for Dust"}
          </span>
          <svg
            className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1 text-[#7b52b9]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path fill="none" d="M0 0h24v24H0z" />
            <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" />
          </svg>
        </div>
      </span>
    </button>
  </div>
</div>

      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse mt-4 bg-black text-white rounded-lg border border-neutral-700">
          <thead>
            <tr>
              <th className="px-2 py-1 border-b border-neutral-700">Token</th>
              <th className="px-2 py-1 border-b border-neutral-700">Name</th>
              <th className="px-2 py-1 border-b border-neutral-700">Symbol</th>
              <th className="px-2 py-1 border-b border-neutral-700">Balance</th>
            </tr>
          </thead>
          <tbody>
            {dustTokens.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-400">
                  No tokens found.
                </td>
              </tr>
            )}
            {dustTokens.map((token) => (
              <tr key={token.address} className="border-b border-zinc-800 hover:bg-zinc-800 transition-colors">
                <td
                  className="px-2 py-1 font-mono text-xs cursor-pointer group text-blue-400 hover:underline"
                  onClick={() => window.open(`${getExplorerUrl(chainId)}/token/${token.address}`, '_blank')}
                  title="View on Explorer"
                >
                  {token.address.slice(0, 8)}...{token.address.slice(-4)}
                </td>
                <td
                  className="px-2 py-1 font-mono text-xs cursor-pointer group text-blue-400 hover:underline"
                  onClick={() => window.open(`${getExplorerUrl(chainId)}/token/${token.address}`, '_blank')}
                  title="View on Explorer"
                >
                  {token.name || "-"}
                </td>
                <td
                  className="px-2 py-1 font-mono text-xs cursor-pointer group text-blue-400 hover:underline"
                  onClick={() => window.open(`${getExplorerUrl(chainId)}/token/${token.address}`, '_blank')}
                  title="View on Explorer"
                >
                  {token.symbol}
                </td>
                <td className="px-2 py-1 cursor-pointer group" onClick={() => navigator.clipboard.writeText(Number(formatUnits(token.balance, token.decimals)).toString())}>
                  <span className="group-hover:text-blue-400 transition-colors" title="Click to copy">{Number(formatUnits(token.balance, token.decimals)).toFixed(6)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
