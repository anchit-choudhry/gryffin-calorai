import { useState } from "react";
import type { FoodItem } from "../db/dbService";
import { fuzzyMatchFoodName } from "@/types";

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
        typeof recipeNode["description"] === "string" ? recipeNode["description"] : "";

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

  const importFromUrl = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setImportedRecipe(null);

    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        setError(`Failed to fetch URL (status ${response.status})`);
        return;
      }

      const html = await response.text();
      const parsed = parseRecipeFromHtml(html, foodItems);

      if (!parsed) {
        setError("No recipe data found on this page. Make sure the URL points to a recipe page.");
        return;
      }

      setImportedRecipe(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import recipe");
    } finally {
      setIsLoading(false);
    }
  };

  const clearImport = () => {
    setUrl("");
    setError(null);
    setImportedRecipe(null);
  };

  return { url, setUrl, isLoading, error, importedRecipe, importFromUrl, clearImport };
}
