import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import type { FoodItem } from "@/db/dbService";
import { fuzzyMatchFoodName } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  query: string;
  corpus: FoodItem[];
  onSelect: (food: FoodItem) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function FoodSearchCombobox({
  query,
  corpus,
  onSelect,
  inputRef,
}: Props): ReactElement | null {
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const [prevQuery, setPrevQuery] = useState(query);
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(
    () => (query.length >= 2 ? fuzzyMatchFoodName(query, corpus, 6) : []),
    [query, corpus],
  );

  // Render-phase state reset: React re-renders immediately with the new index,
  // avoiding the double-render that setState inside useEffect would cause.
  if (query !== prevQuery) {
    setPrevQuery(query);
    if (activeIndex !== -1) setActiveIndex(-1);
  }

  const handleSelect = useCallback(
    (food: FoodItem) => {
      onSelect(food);
      setActiveIndex(-1);
    },
    [onSelect],
  );

  // Keyboard navigation from the name input: ArrowDown enters the list.
  useEffect(() => {
    const input = inputRef.current;
    if (!input || matches.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(activeIndex + 1, matches.length - 1);
        setActiveIndex(nextIndex);
        const el = listRef.current?.children[nextIndex];
        if (el instanceof Element && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const match = matches[activeIndex];
        if (match) handleSelect(match);
      } else if (e.key === "Escape") {
        setActiveIndex(-1);
      }
    };

    input.addEventListener("keydown", onKeyDown);
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-haspopup", "listbox");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-expanded", "true");
    input.setAttribute("aria-controls", listId);
    if (activeIndex >= 0) {
      input.setAttribute("aria-activedescendant", `${listId}-${activeIndex}`);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
    return () => {
      input.removeEventListener("keydown", onKeyDown);
      input.removeAttribute("aria-autocomplete");
      input.removeAttribute("aria-haspopup");
      input.removeAttribute("role");
      input.removeAttribute("aria-expanded");
      input.removeAttribute("aria-controls");
      input.removeAttribute("aria-activedescendant");
    };
  }, [inputRef, matches, activeIndex, handleSelect, listId]);

  if (matches.length === 0) return null;

  return (
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label="Recent food matches"
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto border border-rule bg-paper shadow-md"
    >
      {matches.map((food, i) => (
        <li
          key={food.id ?? food.name}
          id={`${listId}-${i}`}
          role="option"
          aria-selected={i === activeIndex}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              // Prevent the input from losing focus before click registers.
              e.preventDefault();
              handleSelect(food);
            }}
            className={cn(
              "flex w-full items-center justify-between px-3 py-2 text-left transition-colors",
              "font-sans text-sm text-ink hover:bg-paper-muted focus-visible:bg-paper-muted",
              i === activeIndex && "bg-paper-muted",
            )}
          >
            <span className="truncate">{food.name}</span>
            <span className="ml-3 shrink-0 font-mono text-[10px] text-ink-soft/60">
              {food.calories} kcal
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
