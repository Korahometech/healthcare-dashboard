import { useParams } from "wouter";
import { usePatients } from "@/hooks/use-patients";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SymptomJournal } from "@/components/symptom-journal";
import { Loader2 } from "lucide-react";

export default function PatientDetails() {
  const { id } = useParams<{ id: string }>();
  const { patients, isLoading } = usePatients();
  const patient = patients.find((p) => p.id === parseInt(id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
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
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
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

        <TabsContent value="appointments">
          <div className="text-center text-muted-foreground">
            Coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}