import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { usePatients } from "@/hooks/use-patients";
import { useGeneticProfiles } from "@/hooks/use-genetic-profiles";
import { Loader2, FileUp, Dna, Calendar } from "lucide-react";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { insertGeneticProfileSchema } from "@db/schema";
import type { InsertGeneticProfile } from "@db/schema";
import { InsightsExplainer } from "@/components/genetic-insights/InsightsExplainer";
import { cn } from "@/lib/utils";

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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="reportDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Report Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date?.toISOString())}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="laboratoryInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Laboratory Information</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter laboratory details" />
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
                        <FormLabel>Testing Methodology</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g. Next Generation Sequencing" />
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
                        <FormLabel>Clinical Interpretation Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter any relevant clinical interpretations or notes"
                            className="min-h-[100px] resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload Genetic Profile
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