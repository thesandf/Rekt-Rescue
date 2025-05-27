"use client"

import { useState } from "react"
import { useWalletClient, useAccount } from "wagmi"
import { encodeFunctionData, parseUnits } from "viem"

// Standard ERC20 ABI fragment
const erc20Abi = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
];

// Standard ERC721 ABI fragment
const erc721Abi = [
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'transferFrom',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
    ],
    outputs: [],
  },
];

export default function ApproveForm() {
  const [tokenType, setTokenType] = useState<"ERC20" | "ERC721">("ERC20")
  const [tokenAddress, setTokenAddress] = useState("")
  const [spender, setSpender] = useState("")
  const [status, setStatus] = useState("")
  const [erc20To, setErc20To] = useState("");
  const [erc20Amount, setErc20Amount] = useState("");
  const [erc721To, setErc721To] = useState("");
  const [erc721TokenId, setErc721TokenId] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const { data: walletClient } = useWalletClient()
  const { address } = useAccount()

  const handleApprove = async () => {
    if (!walletClient || !address || !tokenAddress || !spender) {
      setStatus("❌ Missing fields or wallet not connected")
      return
    }

    try {
      const data = tokenType === "ERC20"
        ? encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [spender as `0x${string}`, parseUnits("100", 18)],
          })
        : encodeFunctionData({
            abi: erc721Abi,
            functionName: 'setApprovalForAll',
            args: [spender as `0x${string}`, true],
          })

      const txHash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data,
        account: address,
      })

      setStatus(`✅ Tx sent: ${txHash.slice(0, 10)}...`)
    } catch (err: any) {
      console.error(err)
      setStatus("❌ Error: " + (err?.message || "Failed"))
    }
  }

  // Call ERC20 transfer
  const handleErc20Transfer = async () => {
    if (!walletClient || !address || !tokenAddress || !erc20To || !erc20Amount) {
      setCallStatus("❌ Missing fields or wallet not connected");
      return;
    }
    try {
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [erc20To as `0x${string}`, parseUnits(erc20Amount, 18)],
      });
      const txHash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data,
        account: address,
      });
      setCallStatus(`✅ ERC20 transfer tx sent: ${txHash.slice(0, 10)}...`);
    } catch (err: any) {
      setCallStatus("❌ Error: " + (err?.message || "Failed"));
    }
  };

  // Call ERC721 transferFrom
  const handleErc721Transfer = async () => {
    if (!walletClient || !address || !tokenAddress || !erc721To || !erc721TokenId) {
      setCallStatus("❌ Missing fields or wallet not connected");
      return;
    }
    try {
      const data = encodeFunctionData({
        abi: erc721Abi,
        functionName: 'transferFrom',
        args: [address as `0x${string}`, erc721To as `0x${string}`, BigInt(erc721TokenId)],
      });
      const txHash = await walletClient.sendTransaction({
        to: tokenAddress as `0x${string}`,
        data,
        account: address,
      });
      setCallStatus(`✅ ERC721 transfer tx sent: ${txHash.slice(0, 10)}...`);
    } catch (err: any) {
      setCallStatus("❌ Error: " + (err?.message || "Failed"));
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-black rounded-xl shadow space-y-4">
      <h2 className="text-xl font-bold">Token Approval</h2>

      <select
        value={tokenType}
        onChange={(e) => setTokenType(e.target.value as "ERC20" | "ERC721")}
        className="w-full border px-3 py-2 rounded bg-black text-white"
      >
        <option value="ERC20" className="bg-black text-white">ERC-20</option>
        <option value="ERC721" className="bg-black text-white">ERC-721</option>
      </select>

      <input
        type="text"
        placeholder="Token Contract Address"
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />

      <input
        type="text"
        placeholder="Spender/Operator Address"
        value={spender}
        onChange={(e) => setSpender(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />

      <button
  onClick={handleApprove}
  className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 group mb-2"
>
  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>

  <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
    <div className="relative z-10 flex items-center space-x-2">
      <span className="transition-all duration-500 group-hover:translate-x-1">
        {tokenType === "ERC20" ? "Approve 100 Tokens" : "Approve All NFTs"}
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


      {status && <div className="text-sm text-gray-700">{status}</div>}

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Call Standard Functions</h3>
        {tokenType === "ERC20" && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Recipient Address (to)"
              value={erc20To}
              onChange={(e) => setErc20To(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Amount (in tokens)"
              value={erc20Amount}
              onChange={(e) => setErc20Amount(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
           <button
  onClick={handleErc20Transfer}
  className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 group"
>
  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>

  <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
    <div className="relative z-10 flex items-center space-x-2">
      <span className="transition-all duration-500 group-hover:translate-x-1">
        Transfer ERC20
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

          </div>
        )}
        {tokenType === "ERC721" && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Recipient Address (to)"
              value={erc721To}
              onChange={(e) => setErc721To(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
            <input
              type="text"
              placeholder="Token ID"
              value={erc721TokenId}
              onChange={(e) => setErc721TokenId(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
            <button
  onClick={handleErc721Transfer}
  className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 group"
>
  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>

  <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
    <div className="relative z-10 flex items-center space-x-2">
      <span className="transition-all duration-500 group-hover:translate-x-1">
        Transfer ERC721
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

          </div>
        )}
        {callStatus && <div className="text-sm text-gray-700 mt-2">{callStatus}</div>}
      </div>
    </div>
  )
}
