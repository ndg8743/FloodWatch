import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.png"],
      manifest: {
        name: "FloodWatch Global",
        short_name: "FloodWatch",
        description: "Worldwide flood monitoring + personal sensors",
        theme_color: "#10b981",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/waterservices\.usgs\.gov/,
            handler: "NetworkFirst",
            options: {
              cacheName: "usgs-cache",
              expiration: { maxAgeSeconds: 900 },
            },
          },
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com/,
            handler: "NetworkFirst",
            options: {
              cacheName: "openmeteo-cache",
              expiration: { maxAgeSeconds: 3600 },
            },
          },
        ],
      },
    }),
  ],
});
