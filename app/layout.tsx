import type { Metadata } from "next";
import "./globals.css";
import SWRProvider from "@/components/SWRProvider";

export const metadata: Metadata = {
  title: "Macro Dashboard",
  description: "Crypto & Macro Economic Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-bg-page text-text-primary">
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
