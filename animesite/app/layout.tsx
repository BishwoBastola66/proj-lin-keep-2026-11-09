import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ProviderContextProvider } from "@/context/ProviderContext";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXUS ANIME — HD Anime Streaming & Discovery",
  description: "Ultra-fast anime streaming, discovery, episode guides and video stream extractors powered by dual upstream providers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#08090d] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
        <ProviderContextProvider>
          <TopBar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ProviderContextProvider>
      </body>
    </html>
  );
}
