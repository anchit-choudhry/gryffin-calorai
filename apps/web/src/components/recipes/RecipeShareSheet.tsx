import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import QrCreator from "qr-creator";
import { Copy, Check, X } from "lucide-react";
import type { Recipe } from "@/db/dbService";
import { useAppState } from "../../state/AppState";
import { buildShareUrl } from "../../lib/recipeShare";
import { cn } from "@/lib/utils";

interface Props {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeShareSheet: FC<Props> = ({ recipe, onClose }) => {
  const { allFoodItems } = useAppState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = buildShareUrl(recipe, allFoodItems);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QrCreator.render(
      {
        text: shareUrl,
        radius: 0,
        ecLevel: "M",
        fill: "oklch(0.18 0.020 60)",
        background: "oklch(0.975 0.012 80)",
        size: 180,
      },
      canvas,
    );
  }, [shareUrl]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: recipe.name, url: shareUrl });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Share recipe: ${recipe.name}`}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    >
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm border border-rule bg-paper p-6 sm:mx-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft/70 mb-0.5">
              Share Recipe
            </span>
            <h2 className="font-display text-lg font-semibold text-ink leading-tight">
              {recipe.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share sheet"
            className="ml-4 flex size-8 shrink-0 items-center justify-center text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex justify-center mb-5 border border-rule bg-paper p-3">
          <canvas
            ref={canvasRef}
            width={180}
            height={180}
            aria-label="QR code for sharing this recipe"
            role="img"
          />
        </div>

        <p className="font-mono text-[10px] text-ink-soft/60 text-center mb-4 leading-relaxed break-all">
          {shareUrl.length > 80 ? `${shareUrl.slice(0, 60)}...` : shareUrl}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 border border-rule px-4 py-2.5",
              "font-mono text-xs uppercase tracking-[0.15em] transition-colors",
              "hover:bg-paper-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon",
              copied && "border-persimmon text-persimmon",
            )}
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy Link"}
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex flex-1 items-center justify-center gap-2 border border-rule bg-persimmon px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-paper transition-colors hover:bg-persimmon/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon"
            >
              Share
            </button>
          )}
        </div>

        <p className="mt-3 font-mono text-[9px] text-ink-soft/50 text-center leading-relaxed">
          Recipient opens the link to import this recipe directly into their app.
        </p>
      </div>
    </div>
  );
};
