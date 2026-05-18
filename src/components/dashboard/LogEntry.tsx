import { memo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MoreHorizontal, Pencil, Star, X } from "lucide-react";
import type { FoodItemId } from "@/types";
import { DEFAULT_MEAL_TYPE } from "@/types";
import type { FoodItem } from "@/db/dbService.ts";
import { motionTokens } from "@/lib/motionVariants";

interface Props {
  log: FoodItem;
  onEdit: (log: FoodItem) => void;
  onDelete: (id: FoodItemId) => void;
  onToggleFavorite: (id: FoodItemId, isFavorite: boolean) => void;
}

const iconBtn =
  "flex items-center justify-center size-9 rounded hover:bg-paper-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1";

const LogEntry = memo(function LogEntry({ log, onEdit, onDelete, onToggleFavorite }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const handleDelete = () => {
    if (log.id) {
      onDelete(log.id);
    }
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
          <p className="font-sans text-base font-semibold text-ink truncate">{log.name}</p>
          <p className="font-mono text-[11px] text-ink-soft mt-0.5 tabular-nums">
            P {log.protein ?? 0}g · C {log.carbs ?? 0}g · F {log.fat ?? 0}g
            {log.servingSize !== 1 && (
              <span className="ml-2 text-ink-soft/70">· {log.servingSize} servings</span>
            )}
          </p>
        </div>
        <span className="font-sans text-lg font-semibold tabular-nums text-ink shrink-0">
          {log.calories.toLocaleString()}
          <span className="font-mono text-[10px] text-ink-soft ml-1">kcal</span>
        </span>
        {/* Mobile menu button — 44px touch target, hidden once container is wide enough */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="@md:hidden flex items-center justify-center size-11 rounded hover:bg-paper-muted transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
          aria-label={`${menuOpen ? "Hide" : "Show"} actions for ${log.name}`}
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="size-4 text-ink-soft" />
        </button>
        {/* Action row — container-driven: shown above @md container width */}
        <div className="hidden @md:flex items-center gap-0.5 opacity-0 [@media(hover:none)]:opacity-100 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          {pendingDelete ? (
            <>
              <button
                onClick={handleDelete}
                className="px-2 py-1 rounded bg-persimmon text-paper font-mono text-[9px] uppercase tracking-wider hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                aria-label={`Confirm delete ${log.name}`}
              >
                Delete
              </button>
              <button
                onClick={() => setPendingDelete(false)}
                className="px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => log.id && onToggleFavorite(log.id, !log.isFavorite)}
                className={iconBtn}
                aria-label={`${log.isFavorite ? "Unstar" : "Star"} ${log.name}`}
              >
                <Star
                  className={`size-3.5 ${log.isFavorite ? "fill-persimmon text-persimmon" : "text-ink-soft"}`}
                />
              </button>
              <button
                onClick={() => onEdit(log)}
                className={iconBtn}
                aria-label={`Edit ${log.name}`}
              >
                <Pencil className="size-3.5 text-ink-soft" />
              </button>
              <button
                onClick={() => setPendingDelete(true)}
                className={iconBtn}
                aria-label={`Delete ${log.name}`}
              >
                <X className="size-3.5 text-ink-soft" />
              </button>
            </>
          )}
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
            {pendingDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 rounded bg-persimmon text-paper font-mono text-[9px] uppercase tracking-wider hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                  aria-label={`Confirm delete ${log.name}`}
                >
                  Delete
                </button>
                <button
                  onClick={() => setPendingDelete(false)}
                  className="px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider text-ink-soft hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-persimmon focus-visible:ring-offset-1"
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => log.id && onToggleFavorite(log.id, !log.isFavorite)}
                  className={iconBtn}
                  aria-label={`${log.isFavorite ? "Unstar" : "Star"} ${log.name}`}
                >
                  <Star
                    className={`size-3.5 ${log.isFavorite ? "fill-persimmon text-persimmon" : "text-ink-soft"}`}
                  />
                </button>
                <button
                  onClick={() => onEdit(log)}
                  className={iconBtn}
                  aria-label={`Edit ${log.name}`}
                >
                  <Pencil className="size-3.5 text-ink-soft" />
                </button>
                <button
                  onClick={() => setPendingDelete(true)}
                  className={iconBtn}
                  aria-label={`Delete ${log.name}`}
                >
                  <X className="size-3.5 text-ink-soft" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
});

LogEntry.displayName = "LogEntry";

export default LogEntry;
