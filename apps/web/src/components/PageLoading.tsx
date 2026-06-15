import type { FC } from "react";
import { SeasonalFlourish } from "./icons/almanac";

interface PageLoadingProps {
  message?: string;
}

const PageLoading: FC<PageLoadingProps> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-96 space-y-3">
    <SeasonalFlourish className="w-40 h-8 text-ink-soft/50 animate-pulse" />
    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft/50">{message}</p>
  </div>
);

export default PageLoading;
