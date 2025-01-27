import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExplainerCard } from "./ExplainerCard";
import type { SelectGeneticProfile } from "@db/schema";
import { Info } from "lucide-react";

interface InsightsExplainerProps {
  profile: SelectGeneticProfile;
}

interface ParsedGeneticData {
  diseaseRisks: Array<{
    condition: string;
    riskLevel: "low" | "moderate" | "high";
    details: string;
    recommendations: string[];
  }>;
  drugResponses: Array<{
    medication: string;
    response: "positive" | "negative" | "neutral";
    details: string;
    recommendations: string[];
  }>;
}

function parseGeneticData(profile: SelectGeneticProfile): ParsedGeneticData {
  const diseaseRiskFactors = profile.diseaseRiskFactors as Record<string, any> || {};
  const drugResponseMarkers = profile.drugResponseMarkers as Record<string, any> || {};

  return {
    diseaseRisks: Object.entries(diseaseRiskFactors).map(([condition, data]) => ({
      condition,
      riskLevel: data.riskLevel || "low",
      details: data.explanation || "No detailed information available",
      recommendations: data.recommendations || [],
    })),
    drugResponses: Object.entries(drugResponseMarkers).map(([medication, data]) => ({
      medication,
      response: data.response || "neutral",
      details: data.explanation || "No detailed information available",
      recommendations: data.recommendations || [],
    })),
  };
}

export function InsightsExplainer({ profile }: InsightsExplainerProps) {
  const { diseaseRisks, drugResponses } = parseGeneticData(profile);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Understanding Your Genetic Profile
            </h3>
            <p className="mt-2 text-sm text-blue-700">
              This report provides insights based on your genetic data. These insights 
              can help you and your healthcare provider make more informed decisions 
              about your health. Remember that genetic factors are just one part of 
              your overall health picture.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disease Risk Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {diseaseRisks.map((risk, index) => (
            <ExplainerCard
              key={index}
              title={risk.condition}
              description="Genetic risk assessment based on your DNA markers"
              riskLevel={risk.riskLevel}
              details={risk.details}
              recommendations={risk.recommendations}
            />
          ))}
          {diseaseRisks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No disease risk factors found in your genetic profile.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medication Response Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {drugResponses.map((response, index) => (
            <ExplainerCard
              key={index}
              title={response.medication}
              description="How your genetics may affect medication response"
              details={response.details}
              recommendations={response.recommendations}
            />
          ))}
          {drugResponses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No medication response data found in your genetic profile.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
