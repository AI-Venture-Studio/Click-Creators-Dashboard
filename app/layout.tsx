import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Click Creators Dashboard",
  description: "Built by AIVS, 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans bg-white dark:bg-gray-950`}>
        <NavbarWrapper />
        <Toaster
          position="top-center"
          toastOptions={{
            className: "text-xs !rounded-xl !shadow-lg !font-sans",
            style: { fontFamily: "var(--font-inter)" },
          }}
        />
        <div className="page-animate">{children}</div>
      </body>
    </html>
  );
}
