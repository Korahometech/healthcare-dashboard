import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dna, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExplainerCardProps {
  title: string;
  description: string;
  tooltipContent: string;
  markerInfo: {
    name: string;
    significance: string;
    risk: "low" | "moderate" | "high";
  };
}

export function ExplainerCard({
  title,
  description,
  tooltipContent,
  markerInfo,
}: ExplainerCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-500";
      case "moderate":
        return "text-yellow-500";
      case "high":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{markerInfo.name}</span>
            <span className={`font-semibold ${getRiskColor(markerInfo.risk)}`}>
              {markerInfo.risk.charAt(0).toUpperCase() + markerInfo.risk.slice(1)} Risk
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{markerInfo.significance}</p>
        </div>
      </CardContent>
    </Card>
  );
}
