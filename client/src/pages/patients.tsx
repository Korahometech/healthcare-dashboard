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
import { usePatientTimeline, TimelineEvent } from "@/hooks/use-patient-timeline";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

type PatientFilters = {
  searchTerm: string;
  healthCondition: string;
  status: string;
};

type InsertPatient = Omit<Patient, "id" | "createdAt"> & {
  emergencyContact?: EmergencyContact;
  medicalNotes?: string;
  status?: "active" | "inactive";
};

const PatientTimeline = ({ patientId, onClose }: { patientId: number; onClose: () => void }) => {
  const { data: timeline, isLoading } = usePatientTimeline(patientId);
  const { toast } = useToast();

  const handleEventClick = (event: TimelineEvent) => {
    toast({
      title: event.title,
      description: event.description,
      variant: event.severity === "high" ? "destructive" : "default",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Patient Timeline</h2>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      {timeline?.length ? (
        <Timeline events={timeline} onEventClick={handleEventClick} />
      ) : (
        <p className="text-center text-muted-foreground py-8">
          No timeline events found for this patient.
        </p>
      )}
    </div>
  );
};

export default function Patients() {
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
    const [filters, setFilters] = useState<PatientFilters>({
    searchTerm: "",
    healthCondition: "",
    status: "all",
  });
  const { patients, createPatient, deletePatient, isLoading } = usePatients();
  const { toast } = useToast();


  const filteredPatients = patients.filter((patient) => {
    const matchesSearch = patient.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesCondition = !filters.healthCondition || 
      patient.healthConditions?.includes(filters.healthCondition);
    const matchesStatus = filters.status === "all" || patient.status === filters.status;

    return matchesSearch && matchesCondition && matchesStatus;
  });


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
      emergencyContact: {
        name: "",
        relationship: "",
        phone: "",
      },
      medicalNotes: "",
      status: "active",
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
         <div>
          <h1 className="text-3xl font-bold">Patients</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient records and medical histories
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
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
                  {/* Personal Information Section */}
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

                  {/* Emergency Contact Section - New */}
                   <AccordionItem value="emergency">
                    <AccordionTrigger>Emergency Contact</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="emergencyContact.name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emergencyContact.phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="emergencyContact.relationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select relationship" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="spouse">Spouse</SelectItem>
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="child">Child</SelectItem>
                                  <SelectItem value="sibling">Sibling</SelectItem>
                                  <SelectItem value="friend">Friend</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Medical History Section - Enhanced */}
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
                          <FormField
                          control={form.control}
                          name="medicalNotes"
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Medical Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Enter any additional medical notes or observations"
                                  className="min-h-[100px]"
                                />
                              </FormControl>
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

      {/* New Search and Filter Section */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={filters.searchTerm}
            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Patients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
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
                {filteredPatients.map((patient) => (
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

                <TabsContent value="timeline">
                  <PatientTimeline 
                    patientId={selectedPatient} 
                    onClose={() => setSelectedPatient(null)} 
                  />
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
                               <div className="grid grid-cols-3">
                              <dt className="font-medium">Medical Notes:</dt>
                              <dd className="col-span-2">{patients.find(p => p.id === selectedPatient)?.medicalNotes || "None"}</dd>
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