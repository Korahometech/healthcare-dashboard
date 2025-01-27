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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dna className="h-5 w-5" />
                Genetic Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPatientId ? (
                  geneticProfiles.length > 0 ? (
                    geneticProfiles.map((profile) => (
                      <div key={profile.id} className="space-y-2">
                        <p className="font-medium">Report from {format(new Date(profile.reportDate), 'PPP')}</p>
                        <p className="text-sm text-muted-foreground">
                          Lab: {profile.laboratoryInfo}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Method: {profile.methodologyUsed}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No genetic risk factors found. Upload genetic data to view insights.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a patient to view their genetic risk factors.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Drug Response Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPatientId ? (
                  geneticProfiles.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Analysis of drug response markers based on genetic data.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No drug response data found. Upload genetic data to view insights.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a patient to view their drug response profile.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Health Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedPatientId ? (
                  geneticProfiles.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Health alerts and recommendations based on genetic analysis.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No health alerts found. Upload genetic data to view potential risks.
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a patient to view their health alerts.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}