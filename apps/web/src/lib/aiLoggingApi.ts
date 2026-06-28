import { classifyFood } from "./localFoodClassifier";
import { searchOff } from "./offProductApi";

export interface RecognizedFoodItem {
  name: string;
  confidence: number;
  source: "off_match" | "estimate";
  offProductId?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export async function recognizePhoto(imageData: string): Promise<RecognizedFoodItem[]> {
  try {
    const classifications = await classifyFood(imageData);
    const results: RecognizedFoodItem[] = [];
    const seenOffIds = new Set<string>();

    for (const classification of classifications) {
      if (classification.score <= 0.1) continue;

      try {
        const offResults = await searchOff(classification.label);

        if (offResults.length > 0 && offResults[0]) {
          const product = offResults[0];
          if (!seenOffIds.has(product.code)) {
            seenOffIds.add(product.code);
            results.push({
              name: product.productName ?? "Unknown",
              confidence: classification.score,
              source: "off_match",
              offProductId: product.code,
              calories: product.energyKcal100g ?? undefined,
              protein: product.proteins100g ?? undefined,
              carbs: product.carbohydrates100g ?? undefined,
              fat: product.fat100g ?? undefined,
            });
          }
        } else {
          results.push({
            name: classification.label,
            confidence: classification.score,
            source: "estimate",
          });
        }
      } catch (err) {
        console.error("[aiLoggingApi] searchOff failed for classification:", err);
      }
    }

    return results;
  } catch (err) {
    console.error("[aiLoggingApi] recognizePhoto failed:", err);
    return [];
  }
}

const STOP_WORDS = new Set([
  "i",
  "me",
  "my",
  "myself",
  "we",
  "our",
  "ours",
  "ourselves",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
  "he",
  "him",
  "his",
  "himself",
  "she",
  "her",
  "hers",
  "herself",
  "it",
  "its",
  "itself",
  "they",
  "them",
  "their",
  "theirs",
  "themselves",
  "what",
  "which",
  "who",
  "whom",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "s",
  "t",
  "can",
  "will",
  "just",
  "don",
  "should",
  "now",
  "am",
  "is",
  "are",
  "was",
  "were",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "be",
  "had",
  "have",
  "had",
  "have",
  "had",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "i",
  "had",
  "some",
]);

const BIGRAMS = [
  "orange juice",
  "apple juice",
  "cranberry juice",
  "grape juice",
  "tomato juice",
  "coconut milk",
  "almond milk",
  "peanut butter",
  "greek yogurt",
  "ice cream",
  "olive oil",
];

function tokenize(text: string): string[] {
  const lower = text.toLowerCase().trim();
  if (!lower) return [];

  // Check for known bigrams first
  for (const bigram of BIGRAMS) {
    if (lower.includes(bigram)) {
      return [bigram];
    }
  }

  // For multi-word input, try as a single phrase first
  const words = lower.split(/\s+/);
  const nonStopWords = words.filter((w) => !STOP_WORDS.has(w));

  if (nonStopWords.length > 1) {
    // Return multi-word phrase as single token
    return [nonStopWords.join(" ")];
  }

  // Single words: filter out stop words
  return nonStopWords;
}

export async function parseText(text: string): Promise<RecognizedFoodItem[]> {
  try {
    const tokens = tokenize(text);
    if (tokens.length === 0) return [];

    const results: RecognizedFoodItem[] = [];
    const seenOffIds = new Set<string>();

    for (const token of tokens) {
      try {
        const offResults = await searchOff(token);

        if (offResults.length > 0 && offResults[0]) {
          const product = offResults[0];
          if (!seenOffIds.has(product.code)) {
            seenOffIds.add(product.code);
            results.push({
              name: product.productName ?? "Unknown",
              confidence: 1.0,
              source: "off_match",
              offProductId: product.code,
              calories: product.energyKcal100g ?? undefined,
              protein: product.proteins100g ?? undefined,
              carbs: product.carbohydrates100g ?? undefined,
              fat: product.fat100g ?? undefined,
            });
          }
        } else {
          results.push({
            name: token,
            confidence: 1.0,
            source: "estimate",
          });
        }
      } catch (err) {
        console.error("[aiLoggingApi] searchOff failed for token:", err);
      }
    }

    return results;
  } catch (err) {
    console.error("[aiLoggingApi] parseText failed:", err);
    return [];
  }
}
