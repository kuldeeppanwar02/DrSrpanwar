import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Panwar SmartCare Hub",
    short_name: "SmartCare Hub",
    description:
      "Hindi-first multi-clinic PWA with booking, QR walk-in token, live queue status aur staff dashboard.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7efe1",
    theme_color: "#0f6b63",
    lang: "hi-IN",
    orientation: "portrait",
    categories: ["medical", "health", "productivity"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
