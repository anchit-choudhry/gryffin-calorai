import { useMemo } from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceCapture } from "../hooks/useVoiceCapture";
import { useAppState } from "../state/AppState";
import { fuzzyMatchFoodName } from "../types";
import type { FoodItem } from "../db/dbService";

interface VoiceFoodLoggerProps {
  onTranscriptMatched?: (foodName: string) => void;
}

const VoiceFoodLogger = ({ onTranscriptMatched }: VoiceFoodLoggerProps) => {
  const { isSupported, isListening, transcript, error, startListening, stopListening } =
    useVoiceCapture();
  const { allFoodItems, favoriteFoods } = useAppState();

  const corpus: readonly FoodItem[] = useMemo(
    () => [
      ...favoriteFoods,
      ...allFoodItems.filter((item) => !favoriteFoods.some((fav) => fav.name === item.name)),
    ],
    [favoriteFoods, allFoodItems],
  );

  const candidates = useMemo(
    () => (transcript ? fuzzyMatchFoodName(transcript, corpus, 3) : []),
    [transcript, corpus],
  );

  return (
    <div className="space-y-4">
      {error && <p className="font-mono text-[11px] text-persimmon">{error}</p>}

      {isListening && (
        <div className="space-y-3">
          <div className="w-full h-32 border border-persimmon bg-persimmon-soft flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center animate-pulse">
              <Mic className="text-persimmon size-6" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-persimmon">
              Listening
            </p>
          </div>
          <button
            onClick={stopListening}
            className="w-full py-2.5 border border-rule font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors"
          >
            Stop Listening
          </button>
        </div>
      )}

      {transcript && !isListening && (
        <div className="space-y-3">
          <div className="border-l-2 border-persimmon pl-4 py-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-1">
              You said
            </p>
            <p className="font-display italic text-lg text-ink">&ldquo;{transcript}&rdquo;</p>
          </div>

          {candidates.length > 0 ? (
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft mb-2">
                Matched foods
              </p>
              <ul className="divide-y divide-rule border-y border-rule">
                {candidates.map((item) => (
                  <li key={item.id ?? item.name}>
                    <button
                      onClick={() => onTranscriptMatched?.(item.name)}
                      className="w-full flex justify-between items-baseline px-0 py-2.5 hover:text-persimmon transition-colors text-left group"
                    >
                      <span className="font-display text-base text-ink group-hover:text-persimmon transition-colors">
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
            onClick={startListening}
            className="w-full py-2.5 border border-rule font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft hover:text-ink transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!isListening && !transcript && (
        <div className="space-y-3">
          <div className="w-full h-32 bg-paper-muted border border-rule flex flex-col items-center justify-center gap-2">
            <MicOff className="text-ink-soft size-5" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {isSupported ? "Click to start listening" : "Not supported in this browser"}
            </span>
          </div>
          <button
            onClick={startListening}
            disabled={!isSupported}
            title={!isSupported ? "Voice recognition is not supported in this browser." : undefined}
            className="w-full py-2.5 bg-persimmon text-paper font-mono text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Speak Food
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceFoodLogger;
