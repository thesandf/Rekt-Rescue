// Utility to map chainId to block explorer base URLs
// Add more chains as needed
export const explorerUrls: Record<number, string> = {
  1: "https://etherscan.io", // Ethereum Mainnet
  11155111: "https://sepolia.etherscan.io", // Sepolia
  8453: "https://basescan.org", // Base Mainnet
  84532: "https://base-sepolia.basescan.org", // Base Sepolia
  // Add more chains here
};

export function getExplorerUrl(chainId: number): string {
  return explorerUrls[chainId] || "https://etherscan.io";
}
