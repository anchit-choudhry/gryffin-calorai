import type { ReactElement } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FoodItem } from "@/db/dbService";
import { fuzzyMatchFoodName } from "@/types";
import { cn } from "@/lib/utils";
import { offProductToFoodItem, searchOff } from "@/lib/offProductApi";

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
  const [offResults, setOffResults] = useState<FoodItem[]>([]);
  const listRef = useRef<HTMLUListElement>(null);

  const localMatches = useMemo(
    () => (query.length >= 2 ? fuzzyMatchFoodName(query, corpus, 6) : []),
    [query, corpus],
  );

  // Mask stale OFF results during render when local matches exist or query is too
  // short - this avoids calling setState inside a useEffect just to clear them.
  const effectiveOffResults = query.length >= 2 && localMatches.length === 0 ? offResults : [];
  const allItems = localMatches.length > 0 ? localMatches : effectiveOffResults;
  const showOffSection = localMatches.length === 0 && effectiveOffResults.length > 0;

  // Render-phase state reset: avoids double-render from setState inside useEffect.
  if (query !== prevQuery) {
    setPrevQuery(query);
    if (activeIndex !== -1) setActiveIndex(-1);
  }

  // Debounced OFF search: only fires when local corpus has no matches.
  useEffect(() => {
    if (query.length < 2 || localMatches.length > 0) return;
    const id = setTimeout(() => {
      void searchOff(query).then((products) => {
        setOffResults(products.map(offProductToFoodItem));
      });
    }, 300);
    return () => clearTimeout(id);
  }, [query, localMatches.length]);

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
    if (!input || allItems.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = Math.min(activeIndex + 1, allItems.length - 1);
        setActiveIndex(nextIndex);
        const el = listRef.current?.querySelector(`[data-item-index="${nextIndex}"]`);
        if (el instanceof Element && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ block: "nearest" });
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        const match = allItems[activeIndex];
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
  }, [inputRef, allItems, activeIndex, handleSelect, listId]);

  if (allItems.length === 0) return null;

  return (
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={showOffSection ? "Open Food Facts results" : "Recent food matches"}
      className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto border border-rule bg-paper shadow-md"
    >
      {showOffSection && (
        <li
          role="presentation"
          className="border-b border-rule px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-ink-soft/50"
        >
          Open Food Facts
        </li>
      )}
      {allItems.map((food, i) => (
        <li
          key={food.id ?? `off-${food.name}-${i}`}
          id={`${listId}-${i}`}
          data-item-index={i}
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
