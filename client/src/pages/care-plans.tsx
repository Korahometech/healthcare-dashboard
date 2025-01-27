import { useState } from "react";
import { useCarePlans } from "@/hooks/use-care-plans";
import { usePatients } from "@/hooks/use-patients";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Calendar, Pill, Target, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { InsertCarePlan, InsertTreatment, InsertMedication, InsertHealthGoal } from "@db/schema";

export default function CarePlans() {
  const [selectedPatientId, setSelectedPatientId] = useState<number>();
  const { carePlans, createCarePlan, addTreatment, addMedication, addHealthGoal, isLoading } = useCarePlans(selectedPatientId);
  const { patients } = usePatients();
  const { toast } = useToast();
  const [newPlanOpen, setNewPlanOpen] = useState(false);

  const form = useForm<InsertCarePlan>({
    resolver: zodResolver(insertCarePlanSchema),
    defaultValues: {
      status: "active",
    },
  });

  const onSubmit = async (values: InsertCarePlan) => {
    try {
      await createCarePlan(values);
      setNewPlanOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Care plan created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading care plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Care Plans</h1>
          <p className="text-muted-foreground mt-1">
            Manage patient care plans and track progress
          </p>
        </div>

        <div className="flex items-center gap-4">
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

          <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedPatientId}>
                <Plus className="h-4 w-4 mr-2" />
                New Care Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Care Plan</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
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
                                  format(field.value, "PPP")
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
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date()
                              }
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Create Plan
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {carePlans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Started {format(new Date(plan.startDate), "PPP")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Treatments</h4>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {plan.treatments?.map((treatment) => (
                  <div
                    key={treatment.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{treatment.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {treatment.frequency}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Medications</h4>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {plan.medications?.map((medication) => (
                  <div
                    key={medication.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{medication.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {medication.dosage}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Goals</h4>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {plan.healthGoals?.map((goal) => (
                  <div key={goal.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{goal.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {goal.status}
                      </span>
                    </div>
                    {goal.targetValue && (
                      <Progress
                        value={
                          (goal.progressEntries?.[0]?.value || 0) /
                          goal.targetValue *
                          100
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
