import type { FC } from "react";

interface PageLoadingProps {
  message?: string;
}

const PageLoading: FC<PageLoadingProps> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-96 space-y-2">
    <div className="w-8 h-8 border-4 border-rule border-t-persimmon rounded-full animate-spin" />
    <p className="text-ink-soft text-sm">{message}</p>
  </div>
);

export default PageLoading;
