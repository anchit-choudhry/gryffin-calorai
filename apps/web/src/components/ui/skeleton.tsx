import type { FC } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

const Skeleton: FC<SkeletonProps> = ({ className }) => (
  <div className={cn("animate-pulse bg-paper-muted rounded-none", className)} aria-hidden="true" />
);

export const DashboardSkeleton: FC = () => (
  <div className="mx-auto max-w-[1280px] px-6 md:px-10 lg:px-14 py-10 grid grid-cols-12 gap-x-6 gap-y-14">
    {/* Hero */}
    <div className="col-span-12 grid grid-cols-12 gap-x-6 gap-y-6 hero-wash pb-8">
      <div className="col-span-12 md:col-span-8 md:col-start-2 space-y-4">
        <Skeleton className="h-[clamp(72px,11vw,120px)] w-1/2" />
        <Skeleton className="h-[3px] w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="col-span-12 flex border-y border-rule/30">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 px-4 py-3 space-y-2 border-l border-rule/30 first:border-l-0"
          >
            <Skeleton className="h-2 w-14" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
    {/* Log section */}
    <div className="col-span-12 space-y-4">
      <Skeleton className="h-5 w-32" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-rule/30">
          <Skeleton className="h-2 w-14" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2 w-1/2" />
          </div>
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  </div>
);

export default Skeleton;
