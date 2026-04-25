import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "डॉ. सत्ताराम पंवार क्लिनिक",
    short_name: "Panwar Clinic",
    description:
      "Hindi-first clinic prototype with bookings, walk-in tokens, live queue status aur PWA style install support.",
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
