import { useRef, useState } from "react";
import { useAppState } from "@/state/AppState";
import { cn, LABEL_MONO_CLS } from "@/lib/utils";

export function AiLoggingPanel() {
  const aiEnabled = useAppState((s) => s.aiEnabled);
  const aiModelConsented = useAppState((s) => s.aiModelConsented);
  const setAiEnabled = useAppState((s) => s.setAiEnabled);
  const setAiModelConsented = useAppState((s) => s.setAiModelConsented);

  const [showConsentSheet, setShowConsentSheet] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const isDownloadingRef = useRef(false);

  const handleToggle = () => {
    if (aiEnabled) {
      setAiEnabled(false);
      return;
    }
    if (aiModelConsented) {
      setAiEnabled(true);
      return;
    }
    setShowConsentSheet(true);
  };

  const handleDownloadAndEnable = async () => {
    if (isDownloadingRef.current) return;
    isDownloadingRef.current = true;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const { preloadClassifier } = await import("@/lib/localFoodClassifier");
      await preloadClassifier(setDownloadProgress);
      setAiModelConsented();
      setAiEnabled(true);
      setShowConsentSheet(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setDownloadError(
        `Could not download the AI model. ${message}. Check your connection and try again.`,
      );
    } finally {
      setIsDownloading(false);
      isDownloadingRef.current = false;
    }
  };

  if (showConsentSheet) {
    return (
      <div className="space-y-4 border border-rule p-4">
        <p className={LABEL_MONO_CLS}>AI Food Recognition - One-time Setup</p>
        <p className="font-body text-sm leading-relaxed text-ink">
          The first time you photograph a meal, the app downloads an 80 MB food recognition model
          that runs entirely on your device. The detected food names are sent to the Open Food Facts
          API to look up nutrition data. Works offline after the initial download.
        </p>
        {isDownloading && (
          <div className="space-y-1">
            <progress
              value={downloadProgress}
              max={100}
              className="h-1 w-full appearance-none [&::-moz-progress-bar]:bg-persimmon [&::-webkit-progress-bar]:bg-paper-muted [&::-webkit-progress-value]:bg-persimmon"
              aria-label="Model download progress"
            />
            <p className="font-mono text-[9px] text-ink-soft">
              Downloading model... {Math.round(downloadProgress)}%
            </p>
          </div>
        )}
        {downloadError !== null && (
          <p role="alert" className="font-mono text-[9px] text-destructive">
            {downloadError}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleDownloadAndEnable()}
            disabled={isDownloading}
            className="flex-1 bg-persimmon py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-paper transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download & Enable
          </button>
          <button
            type="button"
            onClick={() => setShowConsentSheet(false)}
            disabled={isDownloading}
            className="border border-rule px-4 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className={LABEL_MONO_CLS}>AI Food Recognition</p>
          <p className="font-mono text-[9px] text-ink-soft">
            {aiEnabled && aiModelConsented
              ? "Model ready - runs entirely on your device"
              : "Identify foods by photo, voice, or text description"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={aiEnabled}
          onClick={handleToggle}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon",
            aiEnabled ? "bg-persimmon" : "bg-rule",
          )}
          aria-label="Toggle AI food recognition"
        >
          <span
            className={cn(
              "pointer-events-none inline-block size-3.5 rounded-full bg-paper shadow-sm transition-transform",
              aiEnabled ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
      </div>
      {!aiModelConsented && (
        <p className="font-mono text-[9px] leading-relaxed text-ink-soft/70">
          AI logging runs entirely on your device. The first time you photograph a meal, an 80 MB
          model downloads and caches. Detected food names are sent to Open Food Facts to look up
          nutrition data.
        </p>
      )}
    </div>
  );
}
