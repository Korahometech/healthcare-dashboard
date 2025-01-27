import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trending?: {
    value: number;
    label: string;
  };
}

export function StatsCard({
  title,
  value,
  icon,
  description,
  trending,
}: StatsCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/10 p-1.5 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">
          {value}
        </div>
        {description && (
          <p className={cn(
            "mt-2 text-xs",
            trending ? "text-muted-foreground" : "text-muted-foreground"
          )}>
            {description}
          </p>
        )}
        {trending && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            <span className={cn(
              trending.value > 0 ? "text-green-500" : "text-red-500"
            )}>
              {trending.value > 0 ? "↑" : "↓"} {Math.abs(trending.value)}%
            </span>
            <span className="text-muted-foreground">
              {trending.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}