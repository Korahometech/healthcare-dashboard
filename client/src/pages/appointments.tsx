import { useState } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { useDoctors } from "@/hooks/use-doctors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Video, Plus, Clock, Trash2 } from "lucide-react";
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
  DialogDescription,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { insertAppointmentSchema } from "@db/schema";
import type { InsertAppointment, SelectAppointment } from "@db/schema";
import { RescheduleDialog } from "@/components/appointments/reschedule-dialog";
import { z } from "zod";
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
import { useQueryClient } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";

type ExtendedAppointment = SelectAppointment & {
  patient?: { name: string };
  duration?: number;
  isTeleconsultation?: boolean;
  meetingUrl?: string;
};

const createAppointmentSchema = insertAppointmentSchema.extend({
  doctorId: z.number(),
  duration: z.number().default(30),
  isTeleconsultation: z.boolean().default(false),
  meetingUrl: z.string().url().optional(),
});

type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

const DURATIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes (recommended)" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
];

export default function Appointments() {
  const [open, setOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<ExtendedAppointment | null>(null);
  const { appointments, updateStatus, createAppointment, updateAppointment, deleteAppointment } = useAppointments();
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateAppointmentInput>({
    resolver: zodResolver(createAppointmentSchema),
    defaultValues: {
      status: "scheduled",
      duration: 30,
      isTeleconsultation: false,
    },
  });

  const isTeleconsultation = form.watch("isTeleconsultation");

  const onSubmit = async (values: CreateAppointmentInput) => {
    try {
      await createAppointment({
        ...values,
        date: values.date instanceof Date ? values.date : new Date(values.date),
      });
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReschedule = async (appointmentId: number, newDate: Date, reason: string) => {
    try {
      await updateAppointment({
        id: appointmentId,
        date: newDate,
        reschedulingReason: reason,
        status: 'rescheduled'
      });

      toast({
        title: "Appointment Rescheduled",
        description: "The appointment has been successfully rescheduled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
    const handleDeleteAppointment = async (appointmentId: number) => {
    try {
      await deleteAppointment(appointmentId);
      toast({
        title: "Success",
        description: "Appointment deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete appointment",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage patient appointments
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Fill in the details to schedule a new patient appointment.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                                {doctor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date & Time</FormLabel>
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
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
                          {DURATIONS.map((duration) => (
                            <SelectItem
                              key={duration.value}
                              value={duration.value.toString()}
                            >
                              {duration.label}
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
                  name="isTeleconsultation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Teleconsultation</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="meetingUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://meet.example.com/room"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full">
                  Schedule Appointment
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(appointments as ExtendedAppointment[]).map((appointment) => (
          <Card key={appointment.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">
                  {appointment.patient?.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(appointment.date), "PPP p")}
                </p>
                {appointment.duration && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {appointment.duration} minutes
                  </p>
                )}
                {appointment.isTeleconsultation && (
                  <div className="flex items-center gap-2 mt-2">
                    <Video className="h-4 w-4" />
                    <span className="text-sm">Video Consultation</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <StatusBadge 
                  status={appointment.status} 
                  className="w-[140px] justify-center"
                />
                <Select
                  value={appointment.status}
                  onValueChange={async (value) => {
                    try {
                      await updateStatus({ id: appointment.id, status: value });
                      toast({
                        title: "Success",
                        description: `Status updated to ${value}`,
                      });
                    } catch (error: any) {
                      toast({
                        title: "Error",
                        description: error.message || "Failed to update status",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setRescheduleAppointment(appointment)}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Reschedule
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this appointment? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {appointment.notes && (
              <p className="text-sm text-muted-foreground mt-4">
                {appointment.notes}
              </p>
            )}

            {appointment.meetingUrl && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => window.open(appointment.meetingUrl, '_blank')}
              >
                <Video className="mr-2 h-4 w-4" />
                Join Meeting
              </Button>
            )}
          </Card>
        ))}
      </div>

      {rescheduleAppointment && (
        <RescheduleDialog
          isOpen={!!rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
          onReschedule={(date, reason) => 
            handleReschedule(rescheduleAppointment.id, date, reason)
          }
          currentDate={new Date(rescheduleAppointment.date)}
        />
      )}
    </div>
  );
}