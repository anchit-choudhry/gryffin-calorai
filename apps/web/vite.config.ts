import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression2";
import { VitePWA } from "vite-plugin-pwa";
// style-src requires 'unsafe-inline' for Tailwind's JIT engine (CSS-only; cannot execute JS).
// Never allow user-controlled values in HTML style attributes.
//
// connect-src: add only specific origins; never expand to 'https:' or '*'.
// When adding a new API integration, append its exact origin here.
const API_ORIGIN = (() => {
  const raw = process.env.VITE_API_BASE_URL ?? "http://localhost:8080";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:8080";
  }
})();

const SECURITY_HEADERS: Record<string, string> = {
  // frame-ancestors is intentionally omitted from the <meta> CSP in index.html because
  // browsers ignore it there (W3C spec). It is enforced only via this HTTP header.
  "Content-Security-Policy":
    `default-src 'self'; script-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://lh3.googleusercontent.com; font-src 'self'; connect-src 'self' https://corsproxy.io https://accounts.google.com ${API_ORIGIN}; worker-src 'self'; frame-src https://accounts.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Restrict camera/microphone to this origin; disable geolocation entirely.
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
  // HSTS: enforce HTTPS for 1 year, include subdomains, allow preload submission.
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Allow popups to communicate back (required for Google Sign-In popup flow).
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  // Require cross-origin resources to opt in via CORP/CORS before being loaded.
  "Cross-Origin-Embedder-Policy": "require-corp",
  // Prevent this origin's resources from being loaded cross-origin without opt-in.
  "Cross-Origin-Resource-Policy": "same-origin",
};

// CSP is excluded from dev server headers: @vitejs/plugin-react injects its Fast Refresh
// preamble as an inline <script type="module">, which script-src 'self' would block,
// preventing window.__vite_plugin_react_preamble_installed__ from ever being set.
const { "Content-Security-Policy": _devCsp, ...DEV_HEADERS } = SECURITY_HEADERS;

const VENDOR_CHUNKS: [string, string][] = [
  ["node_modules/react-dom", "vendor-react"],
  ["node_modules/react/", "vendor-react"],
  ["node_modules/recharts", "vendor-charts"],
  ["node_modules/d3-", "vendor-charts"],
  ["node_modules/victory-", "vendor-charts"],
  ["node_modules/dexie", "vendor-db"],
  ["node_modules/lucide-react", "vendor-icons"],
  ["node_modules/sonner", "vendor-ui"],
  ["node_modules/radix-ui", "vendor-ui"],
  ["node_modules/class-variance-authority", "vendor-ui"],
  ["node_modules/clsx", "vendor-ui"],
  ["node_modules/tailwind-merge", "vendor-ui"],
  ["node_modules/motion", "vendor-motion"],
  ["node_modules/fflate", "vendor-state"],
  ["node_modules/zustand", "vendor-state"],
  ["node_modules/react-hook-form", "vendor-form"],
  ["node_modules/@hookform", "vendor-form"],
  ["node_modules/zod", "vendor-form"],
];

export default defineConfig({
  base: "/gryffin-calorai/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({
      algorithms: ["gzip", "brotliCompress"],
    }),
    VitePWA({
      registerType: "autoUpdate",
      // 'script' injects <script src="registerSW.js"> which satisfies script-src 'self' CSP
      injectRegister: "script",
      includeAssets: ["favicon.svg", "scarlet-gryffin.jpg"],
      manifest: {
        id: "/gryffin-calorai/",
        name: "Gryffin Calorai",
        short_name: "Calorai",
        description: "Offline-first nutrition and calorie tracker. No accounts, no cloud.",
        theme_color: "#0A0A0A",
        background_color: "#E8E0D5",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/gryffin-calorai/",
        scope: "/gryffin-calorai/",
        lang: "en",
        categories: ["health", "fitness", "food"],
        icons: [
          {
            src: "scarlet-gryffin.jpg",
            sizes: "160x160",
            type: "image/jpeg",
          },
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
        screenshots: [
          {
            src: "scarlet-gryffin.jpg",
            sizes: "160x160",
            type: "image/jpeg",
            form_factor: "narrow",
            label: "Dashboard - daily calorie tracking",
          },
        ],
        share_target: {
          action: "/gryffin-calorai/#log?",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url",
          },
        },
      },
      workbox: {
        // Pre-cache all build outputs (JS chunks, CSS, HTML, static assets)
        globPatterns: ["**/*.{js,css,html,svg,jpg,jpeg,png,ico,woff,woff2}"],
        cleanupOutdatedCaches: true,
        // Cache-first for all navigation since app is fully offline
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        // Serve app-shell immediately from cache; network updates in background
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
    {
      name: "strip-csp-meta-dev",
      apply: "serve",
      transformIndexHtml: (html: string) =>
        html.replace(/<meta\s+http-equiv="Content-Security-Policy"[^>]*>/i, ""),
    },
  ],
  server: { headers: DEV_HEADERS },
  preview: { headers: SECURITY_HEADERS },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules/")) return;
          return VENDOR_CHUNKS.find(([path]) => id.includes(path))?.[1];
        },
      },
    },
  },
});
