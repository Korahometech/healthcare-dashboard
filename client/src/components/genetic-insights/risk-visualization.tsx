import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RiskFactor {
  name: string;
  risk: number;
  description: string;
  recommendations: string[];
}

interface RiskVisualizationProps {
  factors: RiskFactor[];
}

export function RiskVisualization({ factors }: RiskVisualizationProps) {
  const getRiskLevel = (risk: number) => {
    if (risk < 30) return "Low";
    if (risk < 70) return "Moderate";
    return "High";
  };

  const getRiskColor = (risk: number) => {
    if (risk < 30) return "bg-green-500";
    if (risk < 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {factors.map((factor, index) => (
        <Card key={`${factor.name}-${index}`}>
          <CardHeader>
            <CardTitle className="text-lg">{factor.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Risk Level: {getRiskLevel(factor.risk)}</span>
                <span>{factor.risk}%</span>
              </div>
              <Progress 
                value={factor.risk} 
                className={`h-2 ${getRiskColor(factor.risk)}`} 
              />
            </div>
            <p className="text-sm text-muted-foreground">{factor.description}</p>
            {factor.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Recommendations:</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {factor.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
