import "./globals.css";
import { Web3Provider } from "./providers";
import { BatchProvider } from "../components/BatchContext";

export const metadata = {
  title: "Rekt Rescue",
  description: "DeFi batch helper",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BatchProvider>
          <Web3Provider>{children}</Web3Provider>
        </BatchProvider>
      </body>
    </html>
  );
}
