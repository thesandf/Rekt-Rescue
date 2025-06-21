"use client";

import { useState , useEffect } from "react";
import { useWalletClient, useAccount, useChainId } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
];

const erc721Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "transferFrom",
    stateMutability: "nonpayable",
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    outputs: [],
  },
];

export default function ApproveForm() {
  const [tokenType, setTokenType] = useState("ERC20");
  const [tokenAddress, setTokenAddress] = useState("");
  const [spender, setSpender] = useState("");
  const [approveAmount, setApproveAmount] = useState("");
  const [approveTokenId, setApproveTokenId] = useState("");
  const [status, setStatus] = useState("");
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();
  const chainId = useChainId();

  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const handleApprove = async () => {
    if (!walletClient || !address || !tokenAddress || !spender) {
      setStatus("❌ Missing fields or wallet not connected");
      return;
    }

    try {
      const data =
        tokenType === "ERC20"
          ? encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [spender as `0x${string}`, parseUnits(approveAmount || "0", 18)],
            })
          : encodeFunctionData({
              abi: erc721Abi,
              functionName: "approve",
              args: [spender as `0x${string}`, BigInt(approveTokenId || "0")],
            });

      const txHash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data,
        account: address,
      });

      setStatus(` Tx sent on chain ${chainId}: ${txHash.slice(0, 10)}...`);
    } catch (err: unknown) {
      const errorMessage = (err as Error)?.message || "Failed";
      setStatus("❌ Error: " + errorMessage);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-black rounded-xl shadow-xl space-y-4 text-white">
      <h2 className="text-2xl font-bold">Universal Approval Tool</h2>
      <span className="text-sm text-gray-400">EVM Chain ID: {chainId}</span>

      <select
        value={tokenType}
        onChange={(e) => setTokenType(e.target.value)}
        className="w-full border border-white px-3 py-2 rounded bg-gray-900 text-white"
      >
        <option value="ERC20">ERC-20</option>
        <option value="ERC721">ERC-721</option>
      </select>

      <input
        type="text"
        placeholder="Token Address (0x...)"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        className="w-full border border-white px-3 py-2 rounded bg-black text-white placeholder-gray-600"
      />

      <input
        type="text"
        placeholder="Spender Address (0x...)"
        value={spender}
        onChange={(e) => setSpender(e.target.value)}
        className="w-full border border-white px-3 py-2 rounded bg-black text-white placeholder-gray-600"
      />

      {tokenType === "ERC20" ? (
        <input
          type="text"
          placeholder="Amount to Approve (e.g., 1.5)"
          value={approveAmount}
          onChange={(e) => setApproveAmount(e.target.value)}
          className="w-full border border-white px-3 py-2 rounded bg-black text-white placeholder-gray-600"
        />
      ) : (
        <input
          type="text"
          placeholder="Token ID to Approve (e.g., 1234)"
          value={approveTokenId}
          onChange={(e) => setApproveTokenId(e.target.value)}
          className="w-full border border-white px-3 py-2 rounded bg-black text-white placeholder-gray-600"
        />
      )}

      <button
        onClick={handleApprove}
        className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 group"
      >
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>
        <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
          <div className="relative z-10 flex items-center space-x-2">
            <span className="transition-all duration-500 group-hover:translate-x-1">
              {tokenType === "ERC20" ? "Approve ERC20 Tokens" : "Approve NFT Token"}
            </span>
            <svg
              className="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1"
              aria-hidden="true"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                clipRule="evenodd"
                fillRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              ></path>
            </svg>
          </div>
        </span>
      </button>

      {status && <div className="text-sm text-gray-400 mt-2">{status}</div>}
    </div>
  );
}
