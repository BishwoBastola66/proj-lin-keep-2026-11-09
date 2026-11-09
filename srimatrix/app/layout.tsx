import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import PreventZoomAndNavigation from "@/components/PreventZoomAndNavigation";
import GlobalPromptDialog from "@/components/GlobalPromptDialog";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SriMatrix",
  description: "Enterprise Workforce & Client Management Platform",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "48x48" },
      { url: "/srimatrix-emblem.png", type: "image/png", sizes: "180x180" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PreventZoomAndNavigation />
        <GlobalPromptDialog />
        {children}
      </body>
    </html>
  );
}
