import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant of skeleton */
  variant?: "default" | "circular" | "text";
  /** Width of skeleton */
  width?: string | number;
  /** Height of skeleton */
  height?: string | number;
}

/**
 * Skeleton loader component
 * Used as placeholder while content is loading
 */
export function Skeleton({
  className,
  variant = "default",
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-muted",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded h-4",
        !variant && "rounded-md",
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      {...props}
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            "w-full",
            i === lines - 1 && lines > 1 && "w-3/4"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for card component
 */
export function SkeletonCard({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("p-4 border border-border rounded-xl space-y-3", className)}>
      <Skeleton variant="text" width="60%" />
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for audio player
 */
export function SkeletonPlayer({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("p-4 border border-border rounded-xl space-y-3", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="25%" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton for voice card
 */
export function SkeletonVoiceCard({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("p-3 border border-border rounded-xl space-y-2", className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" className="mt-1" />
        </div>
      </div>
    </div>
  );
}
