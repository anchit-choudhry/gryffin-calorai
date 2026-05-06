import React from "react";

interface PageLoadingProps {
  message?: string;
}

const PageLoading: React.FC<PageLoadingProps> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-96 space-y-2">
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    <p className="text-gray-500 dark:text-gray-400">{message}</p>
  </div>
);

export default PageLoading;
