import type { FC } from "react";
import { memo } from "react";
import { motion } from "motion/react";
import { Pencil, Star, X } from "lucide-react";
import type { FoodItemId } from "../../types";
import { DEFAULT_MEAL_TYPE } from "../../types";
import type { FoodItem } from "../../db/dbService";

interface Props {
  log: FoodItem;
  onEdit: (log: FoodItem) => void;
  onDelete: (id: FoodItemId) => void;
  onToggleFavorite: (id: FoodItemId, isFavorite: boolean) => void;
}

const LogEntry: FC<Props> = memo(({ log, onEdit, onDelete, onToggleFavorite }) => (
  <motion.li
    layout
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
    className="flex items-baseline gap-4 py-4 group"
    data-testid="log-entry"
  >
    <span className="font-mono uppercase text-[10px] tracking-[0.25em] text-ink-soft w-20 shrink-0">
      {log.mealType ?? DEFAULT_MEAL_TYPE}
    </span>
    <div className="flex-1 min-w-0">
      <p className="font-display text-xl text-ink truncate">{log.name}</p>
      <p className="font-mono text-[11px] text-ink-soft mt-0.5 tabular-nums">
        P {log.protein ?? 0}g · C {log.carbs ?? 0}g · F {log.fat ?? 0}g
      </p>
    </div>
    <span className="font-display text-2xl tabular-nums text-ink shrink-0">
      {log.calories.toLocaleString()}
      <span className="font-mono text-[10px] text-ink-soft ml-1">kcal</span>
    </span>
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
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
        onClick={() => log.id && onDelete(log.id)}
        className="p-1.5 rounded hover:bg-paper-muted transition-colors"
        aria-label={`Delete ${log.name}`}
      >
        <X className="size-3.5 text-ink-soft" />
      </button>
    </div>
  </motion.li>
));

LogEntry.displayName = "LogEntry";

export default LogEntry;
