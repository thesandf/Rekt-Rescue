'use client';

import React, { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient, useChainId } from "wagmi";
import { decodeEventLog } from "viem";
import { ClipboardIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatUnits, isAddress, maxUint256 } from "viem";
import { officialSpenderContracts } from "../utils/SpenderList";
import { getExplorerUrl } from "../utils/explorerUtils";

const erc20ApprovalAbi = [{
  type: "event",
  name: "Approval",
  inputs: [
    { name: "owner", type: "address", indexed: true },
    { name: "spender", type: "address", indexed: true },
    { name: "value", type: "uint256", indexed: false },
  ],
}];

const erc721Abi = [
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "approved", type: "address", indexed: true },
      { name: "tokenId", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "operator", type: "address", indexed: true },
      { name: "approved", type: "bool", indexed: false },
    ],
  },
];

type DecodedLog = {
  blockNumber: bigint;
  transactionHash: string;
  logIndex: number;
  address: string; // token address
  eventName: string;
  args: Record<string, any>;
};

// Copiable cell component
function CopiableCell({ value, short, className = "" }: { value: string, short?: boolean, className?: string }) {
  const [copied, setCopied] = React.useState(false);
  const display = short ? value.slice(0, 6) + "..." + value.slice(-4) : value;
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="whitespace-nowrap">{display}</span>
      <button
        aria-label="Copy"
        className="ml-1 p-0.5 rounded hover:bg-neutral-800"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
        tabIndex={0}
        type="button"
      >
        <ClipboardIcon className="w-4 h-4 text-neutral-400" />
      </button>
      {copied && <span className="text-xs text-green-400 ml-1">Copied!</span>}
    </span>
  );
}

// Risk level helper (returns just color and tooltip for dot)
function getRiskIndicator(log: DecodedLog): { color: string, tooltip: string } {
  if (log.eventName === "Approval" && log.args.value !== undefined) {
    const value = BigInt(log.args.value);
    if (value === maxUint256) return { color: "bg-red-600", tooltip: "Unlimited approval" };
    if (value > 0n && value >= 10n ** 21n) return { color: "bg-yellow-400", tooltip: "Large amount" };
    if (value > 0n) return { color: "bg-green-600", tooltip: "Limited approval" };
  }
  if (log.eventName === "ApprovalForAll" && log.args.approved) {
    return { color: "bg-red-600", tooltip: "ApprovalForAll" };
  }
  return { color: "bg-green-600", tooltip: "No risk" };
}

export default function ApprovalScanner (){
  const { address } = useAccount();
  const client = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [logs, setLogs] = useState<DecodedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [tokenSymbols, setTokenSymbols] = useState<Record<string, string>>({});
  const [blockRange, setBlockRange] = useState(5000); // default 5000 blocks
  const [fromBlockInput, setFromBlockInput] = useState(0n);
  const [toBlockInput, setToBlockInput] = useState<bigint | 'latest'>('latest');
  const [latestBlock, setLatestBlock] = useState<bigint>(0n);
  const [showInfo, setShowInfo] = useState(false);

  // Fetch latest block on mount
  useEffect(() => {
    async function fetchLatest() {
      if (client) {
        const latest = await client.getBlockNumber();
        setLatestBlock(latest);
        setFromBlockInput(latest - BigInt(blockRange) + 1n);
        setToBlockInput(latest);
      }
    }
    fetchLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, blockRange]);

  // Helper to split block range into batches
  function splitBlockRanges(from: bigint, to: bigint, batchSize: number): Array<{from: bigint, to: bigint}> {
    const ranges = [];
    let start = from;
    while (start <= to) {
      let end = start + BigInt(batchSize) - 1n;
      if (end > to) end = to;
      ranges.push({ from: start, to: end });
      start = end + 1n;
    }
    return ranges;
  }

  const fetchLogs = async () => {
    if (!address || !client) return;
    setLoading(true);
    const allLogs: DecodedLog[] = [];
    let fromBlock = fromBlockInput;
    let toBlock = toBlockInput === 'latest' ? latestBlock : toBlockInput;
    if (fromBlock < 0n) fromBlock = 0n;
    if (toBlock > latestBlock) toBlock = latestBlock;
    if (fromBlock > toBlock) [fromBlock, toBlock] = [toBlock, fromBlock];
    const batchSize = 9000; // stay under 10k for free RPC
    const ranges = splitBlockRanges(fromBlock, toBlock, batchSize);

    const queries = [
      {
        abi: erc20ApprovalAbi,
        eventName: "Approval",
        args: { owner: address },
      },
      {
        abi: erc721Abi,
        eventName: "Approval",
        args: { owner: address },
      },
      {
        abi: erc721Abi,
        eventName: "ApprovalForAll",
        args: { owner: address },
      },
    ];

    for (const { abi, eventName, args } of queries) {
      for (const range of ranges) {
        try {
          const eventAbi = abi.find(e => e.type === 'event' && e.name === eventName);
          if (!eventAbi) continue;
          const rawLogs = await client.getLogs({
            fromBlock: range.from,
            toBlock: range.to,
            event: eventAbi as any,
            args,
          });
          for (const log of rawLogs) {
            try {
              const decoded = decodeEventLog({
                abi,
                data: log.data,
                topics: log.topics as any,
              });
              allLogs.push({
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                logIndex: log.logIndex,
                address: log.address,
                eventName,
                args: decoded.args ?? {},
              });
            } catch (err) {
              console.warn(`Failed decoding ${eventName}:`, err);
            }
          }
        } catch (err) {
          console.error(`Error fetching ${eventName} [${range.from}-${range.to}]`, err);
        }
      }
    }
    // Deduplicate
    const uniqueLogs = allLogs.filter(
      (log, index, self) =>
        index === self.findIndex(
          (l) =>
            l.transactionHash === log.transactionHash &&
            l.logIndex === log.logIndex
        )
    );
    setLogs(uniqueLogs);
    setLoading(false);
  };

  // Fetch token symbol for each unique token address
  useEffect(() => {
    const fetchSymbols = async () => {
      if (!client) return;
      const uniqueAddresses = Array.from(new Set(logs.map(l => l.address)));
      const newSymbols: Record<string, string> = { ...tokenSymbols };
      for (const addr of uniqueAddresses) {
        if (!newSymbols[addr] && isAddress(addr)) {
          try {
            // ERC20 symbol() ABI
            const symbol = await client.readContract({
              address: addr as `0x${string}`,
              abi: [{ name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] }],
              functionName: "symbol",
            });
            newSymbols[addr] = symbol as string;
          } catch {
            newSymbols[addr] = "";
          }
        }
      }
      setTokenSymbols(newSymbols);
    };
    if (logs.length > 0) fetchSymbols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, client]);

  const formatAmount = (log: DecodedLog) => {
    if (log.eventName === "Approval" && log.args.value !== undefined) {
      const symbol = tokenSymbols[log.address] || "";
      try {
        return `${formatUnits(BigInt(log.args.value), 18)}${symbol ? ` ${symbol}` : ""}`;
      } catch {
        return `${BigInt(log.args.value).toString()}${symbol ? ` ${symbol}` : " (raw)"}`;
      }
    }
    if (log.eventName === "Approval" && log.args.tokenId !== undefined) {
      return `Token ID: ${log.args.tokenId} (ERC721)`;
    }
    if (log.eventName === "ApprovalForAll") {
      return `All NFTs: ${log.args.approved ? "Approved" : "Revoked"}`;
    }
    return "-";
  };

  const getSpender = (log: DecodedLog) => {
    if (log.eventName === "Approval") {
      return log.args.spender || log.args.approved || "-";
    }
    if (log.eventName === "ApprovalForAll") {
      return log.args.operator;
    }
    return "-";
  };

  // Helper to get spender name if known
  function getSpenderName(address: string): string | undefined {
    const lower = address?.toLowerCase();
    for (const [name, addr] of Object.entries(officialSpenderContracts)) {
      if (addr.toLowerCase() === lower) return name;
    }
    return undefined;
  }

  const getEventLabel = (log: DecodedLog) => {
    if (log.eventName === "Approval") {
      if ("value" in log.args) return "ERC20 Approval";
      if ("tokenId" in log.args) return "ERC721 Approval";
    }
    if (log.eventName === "ApprovalForAll") return "ERC721 ApprovalForAll";
    return log.eventName;
  };

  // Sort logs by owner address for device-friendly display
  const sortedLogs = [...logs].sort((a, b) => {
    const ao = a.args.owner || "";
    const bo = b.args.owner || "";
    return ao.localeCompare(bo);
  });

  return (
    <div className="p-2 sm:p-4 min-h-screen w-full border border-neutral-700 rounded-lg" style={{ background: '#000', color: '#fff' }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">ERC-20 & ERC-721 Approvals</h1>
        <button
          className="ml-2 p-1 rounded-full hover:bg-neutral-800 focus:outline-none"
          aria-label="Info"
          onClick={() => setShowInfo(true)}
        >
          <InformationCircleIcon className="w-6 h-6 text-blue-400" />
        </button>
      </div>
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-neutral-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-neutral-800"
              aria-label="Close info"
              onClick={() => setShowInfo(false)}
            >
              <XMarkIcon className="w-5 h-5 text-neutral-400" />
            </button>
            <h2 className="text-xl font-bold mb-2">How to Use Approval Scanner</h2>
            <ol className="list-decimal list-inside text-sm mb-4 space-y-1">
              <li>Connect your wallet (top right) to scan your approvals.</li>
              <li>Select the <b>Block Range</b> to control how many blocks are scanned (higher = more results, but slower).</li>
              <li>Adjust the <b>From</b> and <b>To</b> block numbers for custom ranges, or click <b>Latest</b> to auto-select the most recent blocks.</li>
              <li>Click <b>Scan Logs</b> to fetch and display all ERC-20 and ERC-721 approvals for your wallet in the selected range.</li>
              <li>Review the table: <b>Spender</b> shows the contract (with name if known), and you can copy addresses or click to view on Etherscan.</li>
              <li>Click <b>Revoke</b> to remove an approval directly from the UI (wallet confirmation required).</li>
            </ol>
            <div className="text-xs text-neutral-400 mb-2">
              <b>Block Range Tips:</b> A larger range will find older approvals, but may take longer and is limited by your RPC provider (max 10,000 blocks per batch). For best results, scan recent blocks first, then expand the range if needed.
            </div>
            <div className="text-xs text-neutral-400">
              <b>Legend:</b> Known spenders show their name, all addresses are copiable, and clicking a spender opens Etherscan.
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <label className="text-sm">Block Range:</label>
        <input
          type="number"
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 w-28 text-white"
          value={blockRange}
          min={1}
          max={10000}
          onChange={e => setBlockRange(Number(e.target.value))}
        />
        <span className="text-xs text-neutral-400">blocks</span>
        <label className="text-sm ml-4">From:</label>
        <input
          type="number"
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 w-36 text-white"
          value={fromBlockInput.toString()}
          min={0}
          max={latestBlock.toString()}
          onChange={e => setFromBlockInput(BigInt(e.target.value))}
        />
        <label className="text-sm ml-2">To:</label>
        <input
          type="number"
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 w-36 text-white"
          value={toBlockInput === 'latest' ? latestBlock.toString() : toBlockInput.toString()}
          min={0}
          max={latestBlock.toString()}
          onChange={e => setToBlockInput(BigInt(e.target.value))}
        />
        <button
          onClick={() => {
            setFromBlockInput(latestBlock - BigInt(blockRange) + 1n);
            setToBlockInput(latestBlock);
          }}
          className="ml-2 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-xs"
        >
          Latest
        </button>
        <button
  onClick={fetchLogs}
  disabled={loading}
  className="relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-105 active:scale-95 group ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
>
  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></span>

  <span className="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
    <div className="relative z-10 flex items-center space-x-2">
      <span className="transition-all duration-500 group-hover:translate-x-1">
        {loading ? "Scanning..." : "Scan Logs"}
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

      <div className="overflow-x-auto mt-6 w-full">
        <div className="min-w-[700px] w-full">
          <table className="w-full border-collapse text-xs sm:text-sm border border-neutral-700 rounded-lg overflow-hidden">
            <thead className="bg-neutral-900">
              <tr>
                <th className="p-2 whitespace-nowrap min-w-[70px]">Block</th>
                <th className="p-2 whitespace-nowrap min-w-[120px]">TxHash</th>
                <th className="p-2 whitespace-nowrap min-w-[90px]">Event</th>
                <th className="p-2 whitespace-nowrap min-w-[120px]">Token</th>
                <th className="p-2 whitespace-nowrap min-w-[120px]">Owner</th>
                <th className="p-2 whitespace-nowrap min-w-[120px]">Spender</th>
                <th className="p-2 whitespace-nowrap min-w-[120px]">Amount / TokenId</th>
                <th className="p-2 whitespace-nowrap min-w-[90px]">Revoke</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log) => (
                <tr
                  key={`${log.transactionHash}-${log.logIndex}`}
                  className="border-b border-neutral-700 hover:bg-neutral-900 last:border-b-0"
                >
                  <td className="p-2 whitespace-nowrap">{log.blockNumber.toString()}</td>
                  <td className="p-2 whitespace-nowrap">
                    <a
                      href={`${getExplorerUrl(chainId)}/tx/${log.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-400"
                      title={log.transactionHash}
                    >
                      <CopiableCell value={log.transactionHash} short />
                    </a>
                  </td>
                  <td className="p-2 whitespace-nowrap">{getEventLabel(log)}</td>
                  <td className="p-2 whitespace-nowrap">
                    <CopiableCell value={log.address} short />
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {log.args.owner ? (
                      <span className="whitespace-nowrap">{log.args.owner.slice(0, 6) + "..." + log.args.owner.slice(-4)}</span>
                    ) : "-"}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    {getSpender(log) && getSpender(log) !== "-" ? (
                      (() => {
                        const spender = getSpender(log);
                        const name = spender && isAddress(spender) ? getSpenderName(spender) : undefined;
                        return (
                          <span className="inline-flex items-center gap-1">
                            <a
                              href={`${getExplorerUrl(chainId)}/address/${spender}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 hover:underline text-blue-400"
                              title={spender}
                            >
                              {name && <span className="font-semibold">{name}</span>}
                              <CopiableCell value={spender} short={false} />
                            </a>
                          </span>
                        );
                      })()
                    ) : "-"}
                  </td>
                  <td className="p-2 whitespace-nowrap">{formatAmount(log)}</td>
                  <td className="p-2 whitespace-nowrap">
                    <button
                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors duration-150 ${getRiskIndicator(log).color} text-white`}
                      onClick={async () => {
                        if (!walletClient || !address) return;
                        let tx;
                        try {
                          if (log.eventName === "Approval" && log.args.spender) {
                            // ERC20: approve(spender, 0)
                            const data = {
                              abi: [{
                                type: 'function',
                                name: 'approve',
                                stateMutability: 'nonpayable',
                                inputs: [
                                  { name: 'spender', type: 'address' },
                                  { name: 'amount', type: 'uint256' },
                                ],
                                outputs: [{ name: 'success', type: 'bool' }],
                              }],
                              functionName: 'approve',
                              args: [log.args.spender, 0n],
                            };
                            tx = await walletClient.writeContract({
                              address: log.address as `0x${string}`,
                              ...data,
                              account: address as `0x${string}`,
                            });
                          } else if (log.eventName === "Approval" && log.args.tokenId) {
                            // ERC721: approve(address(0), tokenId)
                            const data = {
                              abi: [{
                                type: 'function',
                                name: 'approve',
                                stateMutability: 'nonpayable',
                                inputs: [
                                  { name: 'to', type: 'address' },
                                  { name: 'tokenId', type: 'uint256' },
                                ],
                                outputs: [],
                              }],
                              functionName: 'approve',
                              args: ["0x0000000000000000000000000000000000000000", log.args.tokenId],
                            };
                            tx = await walletClient.writeContract({
                              address: log.address as `0x${string}`,
                              ...data,
                              account: address as `0x${string}`,
                            });
                          } else if (log.eventName === "ApprovalForAll" && log.args.operator) {
                            // ERC721: setApprovalForAll(operator, false)
                            const data = {
                              abi: [{
                                type: 'function',
                                name: 'setApprovalForAll',
                                stateMutability: 'nonpayable',
                                inputs: [
                                  { name: 'operator', type: 'address' },
                                  { name: 'approved', type: 'bool' },
                                ],
                                outputs: [],
                              }],
                              functionName: 'setApprovalForAll',
                              args: [log.args.operator, false],
                            };
                            tx = await walletClient.writeContract({
                              address: log.address as `0x${string}`,
                              ...data,
                              account: address as `0x${string}`,
                            });
                          }
                          alert("Revoke transaction sent!\nTx: " + (typeof tx === "string" ? tx.slice(0, 66) : JSON.stringify(tx)));
                        } catch (err: any) {
                          alert("Revoke failed: " + (err?.message || err));
                        }
                      }}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
