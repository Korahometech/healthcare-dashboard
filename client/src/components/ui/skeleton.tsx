import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Card skeleton for consistent loading states
function CardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// Text skeleton with multiple lines
function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full"
          )} 
        />
      ))}
    </div>
  );
}

// Stats card skeleton for analytics
function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

// Chart skeleton for analytics
function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-[200px] w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

// Avatar skeleton
function AvatarSkeleton() {
  return <Skeleton className="h-10 w-10 rounded-full" />;
}

export { 
  Skeleton, 
  CardSkeleton, 
  TextSkeleton, 
  StatsCardSkeleton, 
  ChartSkeleton, 
  AvatarSkeleton 
}