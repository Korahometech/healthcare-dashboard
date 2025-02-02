import { useParams } from "wouter";
import { usePatients } from "@/hooks/use-patients";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SymptomJournal } from "@/components/symptom-journal";
import { CardSkeleton, TextSkeleton, StatsCardSkeleton } from "@/components/ui/skeleton";

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const { patients, isLoading } = usePatients();
  const patient = patients.find((p) => p.id === parseInt(id));

  if (isLoading) {
    return (
      <div className="container py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-6">
          {/* Header skeleton */}
          <TextSkeleton lines={2} />

          {/* Tabs skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2 border-b">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="px-4 py-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Tab content skeleton */}
            <div className="space-y-6">
              <CardSkeleton />
              <StatsCardSkeleton />
              <div className="grid gap-4 md:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return <div>Patient not found</div>;
  }

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">{patient.name}</h1>

      <Tabs defaultValue="symptom-journal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="symptom-journal">Symptom Journal</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="symptom-journal" className="space-y-4">
          <SymptomJournal patientId={patient.id} />
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Contact Information</h3>
              <p>Email: {patient.email || "Not provided"}</p>
              <p>Phone: {patient.phone || "Not provided"}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}