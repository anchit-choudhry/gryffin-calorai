import { memo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MoreHorizontal, Pencil, Star, X } from "lucide-react";
import type { FoodItemId } from "@/types";
import { DEFAULT_MEAL_TYPE } from "@/types";
import type { FoodItem } from "@/db/dbService.ts";
import { motionTokens } from "@/lib/motionVariants";
import { ICON_BTN_CLS } from "@/lib/utils";
import { ProvenanceBadge } from "../ProvenanceBadge";

interface Props {
  log: FoodItem;
  onEdit: (log: FoodItem) => void;
  onDelete: (id: FoodItemId) => void;
  onToggleFavorite: (id: FoodItemId, isFavorite: boolean) => void;
}

interface ActionStripProps {
  log: FoodItem;
  onDelete: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
}

function ActionStrip({ log, onDelete, onEdit, onToggleFavorite }: ActionStripProps) {
  return (
    <>
      <button
        onClick={onToggleFavorite}
        className={ICON_BTN_CLS}
        aria-label={`${log.isFavorite ? "Unstar" : "Star"} ${log.name}`}
      >
        <Star
          className={`size-3.5 ${log.isFavorite ? "fill-persimmon text-persimmon" : "text-ink-soft"}`}
        />
      </button>
      <button onClick={onEdit} className={ICON_BTN_CLS} aria-label={`Edit ${log.name}`}>
        <Pencil className="size-3.5 text-ink-soft" />
      </button>
      <button onClick={onDelete} className={ICON_BTN_CLS} aria-label={`Delete ${log.name}`}>
        <X className="size-3.5 text-ink-soft" />
      </button>
    </>
  );
}

const LogEntry = memo(function LogEntry({ log, onEdit, onDelete, onToggleFavorite }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = () => {
    if (log.id) onDelete(log.id);
  };

  const stripProps: ActionStripProps = {
    log,
    onDelete: handleDelete,
    onEdit: () => onEdit(log),
    onToggleFavorite: () => log.id && onToggleFavorite(log.id, !log.isFavorite),
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: motionTokens.durState, ease: motionTokens.easeOutExpo }}
      className="flex flex-col py-4 group"
      data-testid="log-entry"
    >
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-ink-soft w-20 shrink-0">
          {log.mealType ?? DEFAULT_MEAL_TYPE}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1 min-w-0">
            <p className="font-sans text-base font-semibold text-ink truncate shrink-0 max-w-[60%]">
              {log.name}
            </p>
            {log.captureMethod && log.captureMethod !== "manual" && (
              <ProvenanceBadge method={log.captureMethod} />
            )}
            <span
              className="flex-1 self-end border-b border-dotted border-rule/40 mb-[3px] min-w-[8px]"
              aria-hidden="true"
            />
            <span className="font-sans text-base font-semibold tabular-nums text-ink shrink-0">
              {log.calories.toLocaleString()}
              <span className="font-mono text-[10px] text-ink-soft ml-1">kcal</span>
            </span>
          </div>
          <p className="font-mono text-[11px] text-ink-soft mt-0.5 tabular-nums">
            P {log.protein ?? 0}g · C {log.carbs ?? 0}g · F {log.fat ?? 0}g
            {log.servingSize !== 1 && (
              <span className="ml-2 text-ink-soft/70">· {log.servingSize} servings</span>
            )}
          </p>
        </div>
        {/* Mobile menu button — 44px touch target, hidden once container is wide enough */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="@md:hidden flex items-center justify-center size-11 rounded-none hover:bg-paper-muted transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-persimmon focus-visible:ring-offset-1 active:scale-[0.97]"
          aria-label={`${menuOpen ? "Hide" : "Show"} actions for ${log.name}`}
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="size-4 text-ink-soft" />
        </button>
        {/* Action row — container-driven: shown above @md container width */}
        <div className="hidden @md:flex items-center gap-0.5 opacity-0 [@media(hover:none)]:opacity-100 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          <ActionStrip {...stripProps} />
        </div>
      </div>
      {/* Mobile action strip */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: motionTokens.durInstant }}
            className="@md:hidden mt-3 flex items-center gap-1 pl-24"
          >
            <ActionStrip {...stripProps} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
});

LogEntry.displayName = "LogEntry";

export default LogEntry;
