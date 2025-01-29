import { useState } from "react";
import { usePatients } from "@/hooks/use-patients";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2, Loader2, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Patient } from "@db/schema";
import { insertPatientSchema } from "@db/schema";
import { Timeline } from "@/components/ui/timeline";
import { usePatientTimeline } from "@/hooks/use-patient-timeline";

type InsertPatient = Omit<Patient, "id" | "createdAt">;

export default function Patients() {
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const { patients, createPatient, deletePatient, isLoading } = usePatients();
  const { data: timeline, isLoading: isLoadingTimeline } = usePatientTimeline(selectedPatient);
  const { toast } = useToast();

  const form = useForm<InsertPatient>({
    resolver: zodResolver(insertPatientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      healthConditions: [],
      medications: [],
      allergies: [],
      chronicConditions: [],
      surgicalHistory: {},
      familyHistory: {},
      vaccinationHistory: {},
      smokingStatus: "never",
      exerciseFrequency: "never",
      preferredCommunication: "email",
    },
  });

  const onSubmit = async (values: InsertPatient) => {
    try {
      const formattedValues = {
        ...values,
        dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
      };
      await createPatient(formattedValues);
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Patient created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create patient",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePatient(id);
      setSelectedPatient(null);
      toast({
        title: "Success",
        description: "Patient removed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete patient",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Patient</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter the patient's information below. All fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Accordion type="single" collapsible defaultValue="personal">
                  {/* Personal Information */}
                  <AccordionItem value="personal">
                    <AccordionTrigger>Personal Information</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
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
                                        format(field.value, "PP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date()
                                    }
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Medical Information */}
                  <AccordionItem value="medical">
                    <AccordionTrigger>Medical Information</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="healthConditions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Health Conditions</FormLabel>
                              <FormControl>
                                <Input {...field} value={(field.value || []).join(", ")} onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))} />
                              </FormControl>
                              <FormDescription>
                                Enter conditions separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="medications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Medications</FormLabel>
                              <FormControl>
                                <Input {...field} value={(field.value || []).join(", ")} onChange={(e) => field.onChange(e.target.value.split(",").map(s => s.trim()))} />
                              </FormControl>
                              <FormDescription>
                                Enter medications separated by commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button type="submit" className="w-full">
                  {form.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Patient"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Health Conditions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedPatient(patient.id)}
                  >
                    <TableCell className="font-medium">{patient.name}</TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.healthConditions?.join(", ")}</TableCell>
                    <TableCell>
                      {patient.createdAt &&
                        format(new Date(patient.createdAt), "PP")}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove {patient.name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently
                              delete the patient and all associated records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(patient.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {selectedPatient && (
            <div className="rounded-lg border p-6">
              <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="records">Medical Records</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Patient Timeline</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Close
                    </Button>
                  </div>

                  {isLoadingTimeline ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : timeline?.length ? (
                    <Timeline events={timeline} />
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No timeline events found for this patient.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="records">
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Medical Records</h2>
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedPatient(null)}
                      >
                        Close
                      </Button>
                    </div>
                    <div className="grid gap-6">
                      {/* Medical History Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Medical History</CardTitle>
                          <CardDescription>Patient's medical history and conditions</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <dl className="grid gap-2">
                            <div className="grid grid-cols-3">
                              <dt className="font-medium">Health Conditions:</dt>
                              <dd className="col-span-2">{patients.find(p => p.id === selectedPatient)?.healthConditions?.join(", ") || "None"}</dd>
                            </div>
                            <div className="grid grid-cols-3">
                              <dt className="font-medium">Medications:</dt>
                              <dd className="col-span-2">{patients.find(p => p.id === selectedPatient)?.medications?.join(", ") || "None"}</dd>
                            </div>
                            <div className="grid grid-cols-3">
                              <dt className="font-medium">Allergies:</dt>
                              <dd className="col-span-2">{patients.find(p => p.id === selectedPatient)?.allergies?.join(", ") || "None"}</dd>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>

                      {/* Lifestyle Information Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Lifestyle Information</CardTitle>
                          <CardDescription>Patient's lifestyle and habits</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <dl className="grid gap-2">
                            <div className="grid grid-cols-3">
                              <dt className="font-medium">Smoking Status:</dt>
                              <dd className="col-span-2 capitalize">{patients.find(p => p.id === selectedPatient)?.smokingStatus || "Not specified"}</dd>
                            </div>
                            <div className="grid grid-cols-3">
                              <dt className="font-medium">Exercise Frequency:</dt>
                              <dd className="col-span-2 capitalize">{patients.find(p => p.id === selectedPatient)?.exerciseFrequency || "Not specified"}</dd>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}
    </div>
  );
}