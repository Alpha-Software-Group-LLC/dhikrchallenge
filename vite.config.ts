import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icons/*.png", "offline.html"],
      manifest: {
        name: "Dhikr Challenge",
        short_name: "Dhikr",
        description:
          "Remember Allah. Together. A private daily practice of remembrance with authentic sources, understanding, and small Circles of family and friends.",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#070d0a",
        theme_color: "#070d0a",
        categories: ["lifestyle", "education"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
        shortcuts: [
          { name: "Today's dhikr", short_name: "Today", url: "/" },
          { name: "Free tasbih", short_name: "Tasbih", url: "/tasbih" },
          { name: "My Circles", short_name: "Circles", url: "/circles" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/audio\/.*\.mp3$/i,
            handler: "CacheFirst",
            options: { cacheName: "dhikr-audio", expiration: { maxEntries: 60 } },
          },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: {
    target: "es2020",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ["@supabase/supabase-js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
