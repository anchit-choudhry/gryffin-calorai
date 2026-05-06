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

export default defineConfig({
  base: `/${packageJson.name}/`,
  plugins: [
    react(),
    tailwindcss(),
    viteCompression({
      algorithms: ["gzip", "brotliCompress"],
    }),
  ],
  server: { headers: SECURITY_HEADERS },
  preview: { headers: SECURITY_HEADERS },
});
