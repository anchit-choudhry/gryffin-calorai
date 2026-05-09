import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import viteCompression from "vite-plugin-compression2";
import packageJson from "./package.json";

// style-src requires 'unsafe-inline' for Tailwind's JIT engine (CSS-only; cannot execute JS).
// Never allow user-controlled values in HTML style attributes.
//
// connect-src: when the barcode food-lookup API is integrated, add only its specific origin
// here (e.g. https://world.openfoodfacts.org) — do NOT expand to '*'.
const SECURITY_HEADERS: Record<string, string> = {
  // frame-ancestors is intentionally omitted from the <meta> CSP in index.html because
  // browsers ignore it there (W3C spec). It is enforced only via this HTTP header.
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Restrict camera/microphone to this origin; disable geolocation entirely.
  "Permissions-Policy": "camera=(self), microphone=(self), geolocation=()",
};

// CSP is excluded from dev server headers: @vitejs/plugin-react injects its Fast Refresh
// preamble as an inline <script type="module">, which script-src 'self' would block,
// preventing window.__vite_plugin_react_preamble_installed__ from ever being set.
const { "Content-Security-Policy": _devCsp, ...DEV_HEADERS } = SECURITY_HEADERS;

const VENDOR_CHUNKS: [string, string][] = [
  ["node_modules/react-dom", "vendor-react"],
  ["node_modules/react/", "vendor-react"],
  ["node_modules/chart.js", "vendor-charts"],
  ["node_modules/react-chartjs-2", "vendor-charts"],
  ["node_modules/@zxing", "vendor-barcode"],
  ["node_modules/dexie", "vendor-db"],
  ["node_modules/react-icons", "vendor-icons"],
  ["node_modules/zustand", "vendor-state"],
];

export default defineConfig({
  base: `/${packageJson.name}/`,
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({
      algorithms: ["gzip", "brotliCompress"],
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
