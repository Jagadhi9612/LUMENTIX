import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELITE FITNESS | Train Strong. Live Elite.",
  description: "Premium gym management SaaS for member operations, revenue, attendance, trainers, packages, and analytics.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-mark.jpeg",
    apple: "/logo-mark.jpeg"
  }
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
