import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { HealthReportTemplate } from "@/components/health-report/health-report-template";
import type { ReactElement } from "react";

export function useHealthReport() {
  const { toast } = useToast();

  const generateReport = useMutation({
    mutationFn: async (patientId: number) => {
      const res = await fetch(`/api/patients/${patientId}/health-report`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      return res.json();
    },
    onSuccess: async (data) => {
      try {
        // Generate PDF
        const blob = await pdf(
          (HealthReportTemplate({
            patient: data.patient,
            appointments: data.appointments,
            symptomJournals: data.symptomJournals,
            generatedDate: new Date(data.generatedDate)
          }) as ReactElement)
        ).toBlob();

        // Download the file
        saveAs(blob, `health-report-${data.patient.name}-${new Date().toISOString().split('T')[0]}.pdf`);

        toast({
          title: "Success",
          description: "Health report generated successfully",
        });
      } catch (error: any) {
        console.error("Error generating PDF:", error);
        toast({
          title: "Error",
          description: "Failed to generate PDF report",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    generateReport: generateReport.mutateAsync,
    isGenerating: generateReport.isPending,
  };
}