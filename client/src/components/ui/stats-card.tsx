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
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-primary/10 p-2 text-primary transition-transform duration-200 hover:scale-110">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">
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
          <div className="mt-2 flex items-center gap-1 text-xs font-medium">
            <span className={cn(
              "flex items-center",
              trending.value > 0 ? "text-emerald-500" : "text-rose-500"
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