
import { http, createConfig } from "wagmi";
import { baseSepolia, mainnet, sepolia } from "wagmi/chains";
import { coinbaseWallet } from "wagmi/connectors";

export const config = createConfig({
  chains: [baseSepolia, mainnet, sepolia],
  connectors: [
    coinbaseWallet({
      appName: "Rekt-Rescue",
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
});
