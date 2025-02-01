import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Recommendation {
  title: string;
  description: string;
}

interface HealthRecommendationsProps {
  patientId: number;
}

export function HealthRecommendations({ patientId }: HealthRecommendationsProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: recommendations, refetch } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: [`/api/recommendations/${patientId}`],
    enabled: false,
  });

  const generateRecommendations = async () => {
    try {
      setIsGenerating(true);
      await refetch();
      toast({
        title: "Recommendations generated",
        description: "New health recommendations are ready for review.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Health Recommendations</h2>
        <Button
          onClick={generateRecommendations}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Recommendations"
          )}
        </Button>
      </div>

      {recommendations?.recommendations && (
        <div className="grid gap-4">
          {recommendations.recommendations.map((rec, index) => (
            <Card key={index} className="p-4">
              <h3 className="font-semibold text-lg mb-2">{rec.title}</h3>
              <p className="text-muted-foreground">{rec.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
