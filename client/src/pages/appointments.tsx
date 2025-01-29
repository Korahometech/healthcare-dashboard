import { useState } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { useDoctors } from "@/hooks/use-doctors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Video } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import type { InsertAppointment, SelectAppointment } from "@db/schema";
import { insertAppointmentSchema } from "@db/schema";
import { z } from "zod";

// Update the appointment schema to include doctorId
const createAppointmentSchema = insertAppointmentSchema.extend({
  doctorId: z.number(),
  isTeleconsultation: z.boolean().optional(),
  meetingUrl: z.string().url().optional(),
  duration: z.number().min(15).max(120).optional(),
});

type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export default function Appointments() {
  const [open, setOpen] = useState(false);
  const { appointments, createAppointment, updateStatus } = useAppointments();
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const { toast } = useToast();

  const form = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      status: "scheduled",
      notes: "",
      isTeleconsultation: false,
      duration: 30,
    },
  });

  const isTeleconsultation = form.watch("isTeleconsultation");

  const onSubmit = async (values: CreateAppointmentInput) => {
    try {
      await createAppointment(values);
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Appointment created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Appointments</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Appointment</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Appointment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="patientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patient</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select patient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem
                              key={patient.id}
                              value={patient.id.toString()}
                            >
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(parseInt(value))
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem
                              key={doctor.id}
                              value={doctor.id.toString()}
                            >
                              {`${doctor.name} (${doctor.specialty?.name || 'General'})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
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
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isTeleconsultation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Teleconsultation
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Schedule a video consultation
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {isTeleconsultation && (
                  <>
                    <FormField
                      control={form.control}
                      name="meetingUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meeting URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://meet.example.com/room" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes)</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Create Appointment
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appointments.map((appointment: SelectAppointment & { patient?: { name: string }, doctor?: { name: string }, teleconsultation?: { meetingUrl: string, duration: number } }) => (
          <Card key={appointment.id} className="space-y-4 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  {appointment.patient?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Doctor: {appointment.doctor?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(appointment.date), "PPP")}
                </p>
                {appointment.teleconsultation && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Video className="h-4 w-4" />
                    <span>
                      {appointment.teleconsultation.duration} min consultation
                    </span>
                  </div>
                )}
              </div>
              <Select
                defaultValue={appointment.status}
                onValueChange={(value) =>
                  updateStatus({ id: appointment.id, status: value })
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {appointment.notes && (
              <p className="text-sm text-muted-foreground">
                {appointment.notes}
              </p>
            )}
            {appointment.teleconsultation && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(appointment.teleconsultation?.meetingUrl, '_blank')}
              >
                <Video className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}