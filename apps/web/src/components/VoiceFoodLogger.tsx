import { useCallback, useMemo, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import { useAppState } from "../state/AppState";
import { fuzzyMatchFoodName } from "../types";
import type { FoodItem } from "../db/dbService";
import type { RecognizedFoodItem } from "../lib/aiLoggingApi";
import { FoodReviewRow } from "./FoodReviewRow";
import { cn, EDITORIAL_INPUT_CLS } from "@/lib/utils";

interface VoiceFoodLoggerProps {
  onTranscriptMatched?: (foodName: string) => void;
}

const VoiceFoodLogger = ({ onTranscriptMatched }: VoiceFoodLoggerProps) => {
  const { isSupported, isListening, transcript, error, startListening, stopListening } =
    useVoiceCapture();
  const { allFoodItems, favoriteFoods } = useAppState();
  const aiEnabled = useAppState((s) => s.aiEnabled);
  const aiModelConsented = useAppState((s) => s.aiModelConsented);

  const [textInput, setTextInput] = useState("");
  const [aiItems, setAiItems] = useState<RecognizedFoodItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseEmpty, setParseEmpty] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const corpus: readonly FoodItem[] = useMemo(
    () => [
      ...favoriteFoods,
      ...allFoodItems.filter((item) => !favoriteFoods.some((fav) => fav.name === item.name)),
    ],
    [favoriteFoods, allFoodItems],
  );

  const isAiReady = aiEnabled && aiModelConsented;

  const candidates = useMemo(
    () => (!isAiReady && transcript ? fuzzyMatchFoodName(transcript, corpus, 3) : []),
    [transcript, corpus, isAiReady],
  );

  const handleParseText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsParsing(true);
    setParseEmpty(false);
    setParseError(null);
    setAiItems([]);
    try {
      const { parseText } = await import("../lib/aiLoggingApi");
      const items = await parseText(text);
      if (items.length === 0) {
        setParseEmpty(true);
      } else {
        setAiItems(items);
      }
    } catch (err) {
      console.error("[VoiceFoodLogger] parseText failed:", err);
      setParseError("Could not connect. Check your connection and try again.");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleItemLogged = useCallback((index: number) => {
    setAiItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemRemoved = useCallback((index: number) => {
    setAiItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="space-y-4">
      {error && <p className="font-mono text-[11px] text-persimmon">{error}</p>}

      {isListening && (
        <div className="space-y-3">
          <div className="flex h-32 w-full flex-col items-center justify-center gap-3 border border-persimmon bg-persimmon-soft">
            <div className="flex animate-pulse items-center justify-center">
              <Mic className="size-6 text-persimmon" aria-hidden="true" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon">
              Listening
            </p>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="w-full border border-rule py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
          >
            Stop Listening
          </button>
        </div>
      )}

      {isAiReady && aiItems.length > 0 && (
        <div className="space-y-2">
          {aiItems.map((item, index) => (
            <FoodReviewRow
              key={item.offProductId ?? `${item.name}-${index}`}
              item={item}
              captureMethod="voice_ai"
              onLogged={() => handleItemLogged(index)}
              onRemove={() => handleItemRemoved(index)}
            />
          ))}
        </div>
      )}

      {!isAiReady && transcript && !isListening && (
        <div className="space-y-3">
          <div className="border-l-2 border-persimmon py-1 pl-4">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              You said
            </p>
            <p className="font-display text-lg italic text-ink">&ldquo;{transcript}&rdquo;</p>
          </div>

          {candidates.length > 0 ? (
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                Matched foods
              </p>
              <ul className="divide-y divide-rule border-y border-rule">
                {candidates.map((item) => (
                  <li key={item.id ?? item.name}>
                    <button
                      type="button"
                      onClick={() => onTranscriptMatched?.(item.name)}
                      className="group flex w-full items-baseline justify-between px-0 py-2.5 text-left transition-colors hover:text-persimmon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
                    >
                      <span className="font-display text-base text-ink transition-colors group-hover:text-persimmon">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] tabular-nums text-ink-soft">
                        {item.calories} kcal
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="font-mono text-[11px] text-ink-soft">
              No matching foods found. Try again or log manually.
            </p>
          )}

          <button
            type="button"
            onClick={startListening}
            className="w-full border border-rule py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
          >
            Try Again
          </button>
        </div>
      )}

      {!isListening && (isAiReady ? aiItems.length === 0 : !transcript) && (
        <div className="space-y-3">
          <div className="flex h-32 w-full flex-col items-center justify-center gap-2 border border-rule bg-paper-muted">
            <MicOff className="size-5 text-ink-soft" aria-hidden="true" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {isSupported ? "Click to start listening" : "Not supported in this browser"}
            </span>
          </div>
          <button
            type="button"
            onClick={startListening}
            disabled={!isSupported}
            title={!isSupported ? "Voice recognition is not supported in this browser." : undefined}
            className="w-full bg-persimmon py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-paper transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon disabled:cursor-not-allowed disabled:opacity-50"
          >
            Speak Food
          </button>
        </div>
      )}

      {isAiReady && (
        <div className="space-y-2 border-t border-rule pt-3">
          <label
            htmlFor="voice-logger-text-input"
            className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-soft"
          >
            Describe your meal
          </label>
          <textarea
            id="voice-logger-text-input"
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setParseEmpty(false);
              setParseError(null);
            }}
            rows={2}
            maxLength={500}
            placeholder="e.g. grilled chicken with rice and salad"
            className={cn(EDITORIAL_INPUT_CLS, "w-full resize-none")}
            aria-label="Describe your meal"
          />
          {parseEmpty && (
            <p className="font-mono text-[9px] text-ink-soft">No foods found - try rephrasing</p>
          )}
          {parseError !== null && (
            <p role="alert" className="font-mono text-[9px] text-destructive">
              {parseError}
            </p>
          )}
          <button
            type="button"
            onClick={() => void handleParseText(textInput)}
            disabled={!textInput.trim() || isParsing}
            aria-label="Parse meal"
            className="w-full border border-rule py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isParsing ? "Parsing..." : "Parse Meal"}
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceFoodLogger;
