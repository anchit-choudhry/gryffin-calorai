import { memo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MoreHorizontal, Pencil, Star, X } from "lucide-react";
import type { FoodItemId } from "@/types";
import { DEFAULT_MEAL_TYPE } from "@/types";
import type { FoodItem } from "@/db/dbService.ts";

interface Props {
  log: FoodItem;
  onEdit: (log: FoodItem) => void;
  onDelete: (id: FoodItemId) => void;
  onToggleFavorite: (id: FoodItemId, isFavorite: boolean) => void;
}

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
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="flex flex-col py-4 group"
      data-testid="log-entry"
    >
      <div className="flex items-baseline gap-4">
        <span className="font-mono uppercase text-[10px] tracking-[0.25em] text-ink-soft w-20 shrink-0">
          {log.mealType ?? DEFAULT_MEAL_TYPE}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xl text-ink truncate">{log.name}</p>
          <p className="font-mono text-[11px] text-ink-soft mt-0.5 tabular-nums">
            P {log.protein ?? 0}g · C {log.carbs ?? 0}g · F {log.fat ?? 0}g
            {log.servingSize !== 1 && (
              <span className="ml-2 text-ink-soft/70">· {log.servingSize} servings</span>
            )}
          </p>
        </div>
        <span className="font-display text-2xl tabular-nums text-ink shrink-0">
          {log.calories.toLocaleString()}
          <span className="font-mono text-[10px] text-ink-soft ml-1">kcal</span>
        </span>
        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-1.5 rounded hover:bg-paper-muted transition-colors shrink-0"
          aria-label={`${menuOpen ? "Hide" : "Show"} actions for ${log.name}`}
        >
          <MoreHorizontal className="size-3.5 text-ink-soft" />
        </button>
        {/* Desktop hover actions */}
        <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
          {pendingDelete ? (
            <>
              <button
                onClick={handleDelete}
                className="px-1.5 py-0.5 rounded bg-persimmon text-paper font-mono text-[9px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                aria-label={`Confirm delete ${log.name}`}
              >
                Delete
              </button>
              <button
                onClick={() => setPendingDelete(false)}
                className="px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => log.id && onToggleFavorite(log.id, !log.isFavorite)}
                className="p-1.5 rounded hover:bg-paper-muted transition-colors"
                aria-label={`${log.isFavorite ? "Unstar" : "Star"} ${log.name}`}
              >
                <Star
                  className={`size-3.5 ${log.isFavorite ? "fill-persimmon text-persimmon" : "text-ink-soft"}`}
                />
              </button>
              <button
                onClick={() => onEdit(log)}
                className="p-1.5 rounded hover:bg-paper-muted transition-colors"
                aria-label={`Edit ${log.name}`}
              >
                <Pencil className="size-3.5 text-ink-soft" />
              </button>
              <button
                onClick={() => setPendingDelete(true)}
                className="p-1.5 rounded hover:bg-paper-muted transition-colors"
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
            transition={{ duration: 0.15 }}
            className="md:hidden mt-3 flex items-center gap-1 pl-24"
          >
            {pendingDelete ? (
              <>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 rounded bg-persimmon text-paper font-mono text-[9px] uppercase tracking-wider hover:opacity-90 transition-opacity"
                  aria-label={`Confirm delete ${log.name}`}
                >
                  Delete
                </button>
                <button
                  onClick={() => setPendingDelete(false)}
                  className="px-2 py-1 rounded font-mono text-[9px] uppercase tracking-wider text-ink-soft hover:text-ink transition-colors"
                  aria-label="Cancel delete"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => log.id && onToggleFavorite(log.id, !log.isFavorite)}
                  className="p-1.5 rounded hover:bg-paper-muted transition-colors"
                  aria-label={`${log.isFavorite ? "Unstar" : "Star"} ${log.name}`}
                >
                  <Star
                    className={`size-3.5 ${log.isFavorite ? "fill-persimmon text-persimmon" : "text-ink-soft"}`}
                  />
                </button>
                <button
                  onClick={() => onEdit(log)}
                  className="p-1.5 rounded hover:bg-paper-muted transition-colors"
                  aria-label={`Edit ${log.name}`}
                >
                  <Pencil className="size-3.5 text-ink-soft" />
                </button>
                <button
                  onClick={() => setPendingDelete(true)}
                  className="p-1.5 rounded hover:bg-paper-muted transition-colors"
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
