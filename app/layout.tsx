import "./globals.css";
import { Web3Provider } from "./providers";

export const metadata = {
  title: "Rekt Rescue",
  description: "DeFi batch helper",
  auther: "THE SANDF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
