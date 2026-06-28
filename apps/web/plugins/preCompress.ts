import { gzipSync, brotliCompressSync } from "node:zlib";
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { Plugin } from "vite";

const COMPRESS_EXTS = new Set([".js", ".css", ".html", ".svg", ".json", ".wasm"]);

function walk(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    if (statSync(abs).isDirectory()) {
      walk(abs);
      continue;
    }
    if (!COMPRESS_EXTS.has(extname(abs))) continue;
    const src = readFileSync(abs);
    writeFileSync(abs + ".gz", gzipSync(src, { level: 9 }));
    writeFileSync(abs + ".br", brotliCompressSync(src));
  }
}

/** Vite build plugin that pre-compresses all build outputs with gzip and Brotli. */
export function preCompress(): Plugin {
  let outDir: string;
  return {
    name: "pre-compress",
    apply: "build",
    configResolved(c) {
      outDir = c.build.outDir;
    },
    closeBundle() {
      walk(outDir);
    },
  };
}
