import type { Metadata, Viewport } from "next";
import { Hind, Tiro_Devanagari_Hindi } from "next/font/google";
import { ClinicProvider } from "@/features/clinic/state/clinic-provider";
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
  title: "डॉ. सत्ताराम पंवार | Hindi-first Clinic PWA Prototype",
  description:
    "डॉ. सत्ताराम पंवार के क्लिनिक के लिए Hindi-first appointment, walk-in token, live queue aur staff dashboard prototype.",
  applicationName: "Panwar Clinic",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Panwar Clinic",
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
        <ClinicProvider>
          <PwaShell />
          {children}
        </ClinicProvider>
      </body>
    </html>
  );
}
