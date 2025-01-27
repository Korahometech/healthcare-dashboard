import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { usePatients } from "@/hooks/use-patients";
import { useGeneticProfiles } from "@/hooks/use-genetic-profiles";
import { Loader2, FileUp, Dna, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { insertGeneticProfileSchema } from "@db/schema";
import type { InsertGeneticProfile } from "@db/schema";
import { InsightsExplainer } from "@/components/genetic-insights/InsightsExplainer";

type GeneticProfileFormValues = Omit<InsertGeneticProfile, 'dnaSequenceData' | 'geneticMarkers' | 'ancestryInformation' | 'diseaseRiskFactors' | 'drugResponseMarkers'> & {
  dnaSequenceData?: Record<string, unknown>;
  geneticMarkers?: Record<string, unknown>;
  ancestryInformation?: Record<string, unknown>;
  diseaseRiskFactors?: Record<string, unknown>;
  drugResponseMarkers?: Record<string, unknown>;
};

export default function GeneticProfiles() {
  const { patients, isLoading: patientsLoading } = usePatients();
  const [selectedPatientId, setSelectedPatientId] = useState<number>();
  const { geneticProfiles, createGeneticProfile, isLoading: profilesLoading } = useGeneticProfiles(selectedPatientId);
  const { toast } = useToast();

  const form = useForm<GeneticProfileFormValues>({
    resolver: zodResolver(insertGeneticProfileSchema),
    defaultValues: {
      dnaSequenceData: {},
      geneticMarkers: {},
      ancestryInformation: {},
      diseaseRiskFactors: {},
      drugResponseMarkers: {},
    },
  });

  const onSubmit = async (values: GeneticProfileFormValues) => {
    if (!selectedPatientId) {
      toast({
        title: "Error",
        description: "Please select a patient first",
        variant: "destructive",
      });
      return;
    }

    try {
      await createGeneticProfile({
        ...values,
        patientId: selectedPatientId,
      });

      toast({
        title: "Success",
        description: "Genetic profile created successfully",
      });

      form.reset();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isLoading = patientsLoading || profilesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading genetic profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Genetic Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient genetic data and personalized medicine insights
          </p>
        </div>

        <Select
          value={selectedPatientId?.toString()}
          onValueChange={(value) => setSelectedPatientId(parseInt(value))}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.map((patient) => (
              <SelectItem key={patient.id} value={patient.id.toString()}>
                {patient.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Genetic Data</CardTitle>
            <CardDescription>
              Import genetic testing results and DNA sequencing data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="laboratoryInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Laboratory Information</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="methodologyUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Methodology</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interpretationNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interpretation Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload Data
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {selectedPatientId && geneticProfiles.length > 0 ? (
            <InsightsExplainer profile={geneticProfiles[0]} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5" />
                  Genetic Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {selectedPatientId
                    ? "No genetic data available. Upload genetic data to view personalized insights."
                    : "Select a patient to view their genetic insights."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}