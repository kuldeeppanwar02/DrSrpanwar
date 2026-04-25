import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Hind, Tiro_Devanagari_Hindi } from "next/font/google";
import {
  ClinicProvider,
  ClinicProviderFallback,
} from "@/features/clinic/state/clinic-provider";
import { LangProvider } from "@/i18n/lang-provider";
import { Navbar } from "@/components/navbar";
import { PwaShell } from "@/components/pwa-shell";
import "./globals.css";

const bodyFont = Hind({
  variable: "--font-body",
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "600", "700"],
});

const displayFont = Tiro_Devanagari_Hindi({
  variable: "--font-display",
  subsets: ["latin", "devanagari"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Panwar SmartCare Hub | Multi-Clinic Appointment & Queue PWA",
  description:
    "Hindi-first multi-clinic PWA with appointment booking, QR walk-in token, staff dashboard aur live queue status.",
  applicationName: "Panwar SmartCare Hub",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Panwar SmartCare Hub",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0f6b63",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="hi"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LangProvider>
          <Suspense
            fallback={
              <ClinicProviderFallback>
                <Navbar />
                <PwaShell />
                <main className="flex-1">{children}</main>
              </ClinicProviderFallback>
            }
          >
            <ClinicProvider>
              <Navbar />
              <PwaShell />
              <main className="flex-1">{children}</main>
            </ClinicProvider>
          </Suspense>
        </LangProvider>
      </body>
    </html>
  );
}
