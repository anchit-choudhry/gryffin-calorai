import { FiMic, FiMicOff } from "react-icons/fi";
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

  const corpus: readonly FoodItem[] = [
    ...favoriteFoods,
    ...allFoodItems.filter((item) => !favoriteFoods.some((fav) => fav.name === item.name)),
  ];

  const candidates = transcript ? fuzzyMatchFoodName(transcript, corpus, 3) : [];

  return (
    <div className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md bg-white dark:bg-gray-800 space-y-4">
      <h3 className="text-xl font-semibold border-b dark:border-gray-700 pb-2 text-gray-700 dark:text-gray-200">
        Voice Logger
      </h3>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {isListening && (
        <div className="space-y-3">
          <div className="w-full h-32 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-full bg-indigo-500 dark:bg-indigo-400 flex items-center justify-center animate-pulse">
              <FiMic className="text-white text-lg" />
            </div>
            <p className="text-sm text-indigo-600 dark:text-indigo-300">Listening...</p>
          </div>
          <button
            onClick={stopListening}
            className="w-full py-2 px-4 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition shadow-sm"
          >
            Stop Listening
          </button>
        </div>
      )}

      {transcript && !isListening && (
        <div className="space-y-3">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">You said:</p>
            <p className="text-base text-indigo-700 dark:text-indigo-300 italic">
              &ldquo;{transcript}&rdquo;
            </p>
          </div>

          {candidates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Matched foods:</p>
              {candidates.map((item) => (
                <button
                  key={item.id ?? item.name}
                  onClick={() => onTranscriptMatched?.(item.name)}
                  className="w-full flex justify-between items-center px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition text-left"
                >
                  <span className="font-medium text-green-800 dark:text-green-300">
                    {item.name}
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {item.calories} kcal
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                No matching foods found. Try again or log manually.
              </p>
            </div>
          )}

          <button
            onClick={startListening}
            className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition shadow-sm font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {!isListening && !transcript && (
        <div className="space-y-3">
          <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 gap-2">
            <FiMicOff className="text-gray-400 dark:text-gray-500 text-2xl" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {isSupported ? "Click to start listening" : "Voice recognition not supported"}
            </span>
          </div>
          <button
            onClick={startListening}
            disabled={!isSupported}
            title={!isSupported ? "Voice recognition is not supported in this browser." : undefined}
            className="w-full py-2 px-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Speak Food
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceFoodLogger;
