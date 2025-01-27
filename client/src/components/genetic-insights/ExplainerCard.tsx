import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ExplainerCardProps {
  title: string;
  description: string;
  riskLevel?: "low" | "moderate" | "high";
  details: string;
  recommendations?: string[];
}

export function ExplainerCard({ 
  title, 
  description, 
  riskLevel, 
  details,
  recommendations 
}: ExplainerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {riskLevel && (
            <Badge
              variant="outline"
              className={cn(
                "ml-2",
                riskLevel === "low" && "bg-green-50 text-green-700 border-green-200",
                riskLevel === "moderate" && "bg-yellow-50 text-yellow-700 border-yellow-200",
                riskLevel === "high" && "bg-red-50 text-red-700 border-red-200"
              )}
            >
              {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={cn(
              "space-y-4 overflow-hidden transition-all",
              !isExpanded && "max-h-20"
            )}
          >
            <p className="text-sm text-muted-foreground">{details}</p>
            {recommendations && recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Recommendations</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-center"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <span className="sr-only">
              {isExpanded ? "Show less" : "Show more"}
            </span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
