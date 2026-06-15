import { useCallback, useState } from "react";
import type { FoodItem } from "../db/dbService";
import { fuzzyMatchFoodName } from "@/types";
import { stripHtml } from "@/lib/utils";

export type ParsedIngredient = {
  rawName: string;
  foodItemId: number;
  foodItemName: string;
  calories: number;
  quantity: number;
  serving: number;
};

export type ParsedRecipe = {
  name: string;
  description: string;
  ingredients: ParsedIngredient[];
};

type UseRecipeImportReturn = {
  url: string;
  setUrl: (url: string) => void;
  isLoading: boolean;
  error: string | null;
  importedRecipe: ParsedRecipe | null;
  importFromUrl: () => Promise<void>;
  clearImport: () => void;
};

const CORS_PROXY = "https://corsproxy.io/?url=";
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB

function isPrivateFirstOctet(a: number, b: number): boolean {
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0) return true;
  return false;
}

/** Parses a single IP octet that may be decimal, hex (0x7f), or octal (0177). */
function parseOctet(s: string): number {
  if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16);
  if (s.startsWith("0") && s.length > 1) return parseInt(s, 8);
  return Number(s);
}

function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost") return true;
  if (h === "[::1]" || h === "::1") return true;
  // IPv6-mapped IPv4 e.g. ::ffff:127.0.0.1 or [::ffff:7f00:1]
  if (h.startsWith("[::ffff:") || h.startsWith("::ffff:")) return true;

  // Decimal single-segment IP: 2130706433 => 127.0.0.1
  if (/^\d+$/.test(h)) {
    const n = Number(h);
    if (n >= 0 && n <= 0xffffffff) {
      return isPrivateFirstOctet((n >>> 24) & 0xff, (n >>> 16) & 0xff);
    }
  }

  // Hex single-segment IP: 0x7f000001 => 127.0.0.1
  if (/^0x[0-9a-f]+$/i.test(h)) {
    const n = parseInt(h, 16);
    if (n >= 0 && n <= 0xffffffff) {
      return isPrivateFirstOctet((n >>> 24) & 0xff, (n >>> 16) & 0xff);
    }
  }

  const parts = h.split(".");
  // Use >= 2 to catch short-notation IPs like 127.1 (resolves to 127.0.0.1 on most systems)
  const [first, second] = parts;
  if (first !== undefined && second !== undefined) {
    const a = parseOctet(first);
    const b = parseOctet(second);
    return isPrivateFirstOctet(a, b);
  }
  return false;
}

function findRecipeNode(parsed: unknown): Record<string, unknown> | null {
  if (typeof parsed !== "object" || parsed === null) return null;
  const obj = parsed as Record<string, unknown>;

  // Direct @type: Recipe
  if (obj["@type"] === "Recipe") return obj;

  // @graph array
  if (Array.isArray(obj["@graph"])) {
    for (const node of obj["@graph"] as unknown[]) {
      const found = findRecipeNode(node);
      if (found) return found;
    }
  }

  return null;
}

export function parseRecipeFromHtml(
  html: string,
  foodItems: readonly FoodItem[],
): ParsedRecipe | null {
  const scriptRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRe.exec(html)) !== null) {
    try {
      const parsed: unknown = JSON.parse(match[1]!);
      const recipeNode = findRecipeNode(parsed);
      if (!recipeNode) continue;

      const name = typeof recipeNode["name"] === "string" ? recipeNode["name"] : "";
      const description =
        typeof recipeNode["description"] === "string"
          ? stripHtml(recipeNode["description"]).slice(0, 500)
          : "";

      const rawIngredients: string[] = Array.isArray(recipeNode["recipeIngredient"])
        ? (recipeNode["recipeIngredient"] as unknown[]).filter(
            (i): i is string => typeof i === "string",
          )
        : [];

      const ingredients: ParsedIngredient[] = rawIngredients.map((rawName) => {
        const matches = fuzzyMatchFoodName(rawName, foodItems, 1);
        const match = matches[0];
        return {
          rawName,
          foodItemId: match?.id ? Number(match.id) : 0,
          foodItemName: match?.name ?? rawName,
          calories: match?.calories ?? 0,
          quantity: 1,
          serving: 1,
        };
      });

      return { name, description, ingredients };
    } catch {
      // malformed JSON - continue to next script tag
    }
  }

  return null;
}

export function useRecipeImport(foodItems: readonly FoodItem[]): UseRecipeImportReturn {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedRecipe, setImportedRecipe] = useState<ParsedRecipe | null>(null);

  const importFromUrl = useCallback(async () => {
    if (!url.trim()) return;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      setError("Enter a valid URL (e.g. https://example.com/recipe).");
      return;
    }
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      setError("Only http:// and https:// URLs are supported.");
      return;
    }
    if (parsedUrl.username || parsedUrl.password) {
      setError("URLs with embedded credentials are not supported.");
      return;
    }
    if (isBlockedHost(parsedUrl.hostname)) {
      setError("Only publicly accessible URLs are supported.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportedRecipe(null);

    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(parsedUrl.href)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        setError(`Failed to fetch URL (status ${response.status})`);
        return;
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
        setError("Page is too large to import (max 5 MB).");
        return;
      }

      const html = await response.text();
      if (html.length > MAX_RESPONSE_BYTES) {
        setError("Page is too large to import (max 5 MB).");
        return;
      }
      const result = parseRecipeFromHtml(html, foodItems);

      if (!result) {
        setError("No recipe data found on this page. Make sure the URL points to a recipe page.");
        return;
      }

      setImportedRecipe(result);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(raw.length > 0 && raw.length <= 120 ? raw : "Failed to import recipe.");
    } finally {
      setIsLoading(false);
    }
  }, [url, foodItems]);

  const clearImport = useCallback(() => {
    setUrl("");
    setError(null);
    setImportedRecipe(null);
  }, []);

  return { url, setUrl, isLoading, error, importedRecipe, importFromUrl, clearImport };
}
