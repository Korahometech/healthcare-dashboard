import { useState } from "react";
import { useParams } from "wouter";
import { ExplainerCard } from "@/components/genetic-insights/explainer-card";
import { RiskVisualization } from "@/components/genetic-insights/risk-visualization";
import { DashboardLayout, DashboardPanel } from "@/components/ui/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGeneticProfiles } from "@/hooks/use-genetic-profiles";
import { Loader2 } from "lucide-react";

export default function GeneticInsights() {
  const { patientId } = useParams();
  const { geneticProfiles, isLoading } = useGeneticProfiles(parseInt(patientId!));
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!geneticProfiles?.length) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-4">Genetic Insights</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">No genetic profile found for this patient.</p>
        </div>
      </div>
    );
  }

  const geneticProfile = geneticProfiles[0];

  // Sample data structure - This should match your schema
  const geneticMarkers = [
    {
      title: "BRCA1/2 Genes",
      description: "These genes help suppress tumor formation",
      tooltipContent: "Mutations in BRCA1/2 genes can increase risk of breast and ovarian cancer",
      markerInfo: {
        name: "BRCA1 Variant",
        significance: "Associated with hereditary breast and ovarian cancer syndrome",
        risk: "moderate" as const,
      },
    },
    {
      title: "Cardiovascular Risk Genes",
      description: "Genes associated with heart health and circulation",
      tooltipContent: "These genetic variants can influence your cardiovascular health",
      markerInfo: {
        name: "ApoE Variant",
        significance: "Influences cholesterol metabolism and cardiovascular health",
        risk: "low" as const,
      },
    },
  ];

  const riskFactors = [
    {
      name: "Cardiovascular Health",
      risk: 45,
      description: "Based on your genetic profile, you have a moderate risk for cardiovascular conditions.",
      recommendations: [
        "Regular blood pressure monitoring",
        "Heart-healthy diet rich in omega-3",
        "Regular cardiovascular exercise",
      ],
    },
    {
      name: "Type 2 Diabetes",
      risk: 25,
      description: "Your genetic markers suggest a lower risk for developing type 2 diabetes.",
      recommendations: [
        "Maintain a healthy weight",
        "Regular blood sugar monitoring",
        "Balanced diet with controlled sugar intake",
      ],
    },
  ];

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Genetic Insights</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Factors</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardLayout>
            <DashboardPanel>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Genetic Markers</h2>
                {geneticMarkers.map((marker, index) => (
                  <ExplainerCard key={index} {...marker} />
                ))}
              </div>
            </DashboardPanel>
            <DashboardPanel>
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Key Findings</h2>
                <RiskVisualization factors={riskFactors} />
              </div>
            </DashboardPanel>
          </DashboardLayout>
        </TabsContent>

        <TabsContent value="risks">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Detailed Risk Analysis</h2>
            <RiskVisualization factors={riskFactors} />
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Personalized Recommendations</h2>
            <div className="grid gap-4">
              {riskFactors.map((factor, index) => (
                <div key={index} className="p-4 rounded-lg border space-y-2">
                  <h3 className="font-medium">{factor.name} Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {factor.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-muted-foreground">{rec}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}