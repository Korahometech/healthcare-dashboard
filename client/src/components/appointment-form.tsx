import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AppointmentAnalytics } from "./appointment-analytics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  patientId: z.number(),
  doctorId: z.number(),
  date: z.date(),
  notes: z.string().optional(),
});

interface AppointmentFormProps {
  patients: Array<{ id: number; name: string }>;
  doctors: Array<{ id: number; name: string }>;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<z.infer<typeof formSchema>>;
  className?: string;
  title?: string;
}

export function AppointmentForm({ 
  patients, 
  doctors, 
  onSubmit, 
  defaultValues,
  className,
  title = "Schedule Appointment"
}: AppointmentFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: defaultValues?.patientId,
      doctorId: defaultValues?.doctorId,
      date: defaultValues?.date ? new Date(defaultValues.date) : undefined,
      notes: defaultValues?.notes,
    },
  });

  const watchDoctorId = form.watch("doctorId");
  const watchDate = form.watch("date");

  return (
    <Card className={cn("transform transition-all duration-300 hover:shadow-lg", className)}>
      <CardHeader className="space-y-1 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Patient</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 transition-colors focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem 
                            key={patient.id} 
                            value={patient.id.toString()}
                            className="cursor-pointer transition-colors hover:bg-primary/5"
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
                  <FormItem className="flex-1">
                    <FormLabel>Doctor</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 transition-colors focus:ring-2 focus:ring-primary/20">
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem 
                            key={doctor.id} 
                            value={doctor.id.toString()}
                            className="cursor-pointer transition-colors hover:bg-primary/5"
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
                            "w-full h-10 px-3 text-left font-normal transition-all duration-200",
                            !field.value && "text-muted-foreground",
                            "hover:bg-primary/5 focus:ring-2 focus:ring-primary/20"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP p")
                          ) : (
                            <span>Pick a date and time</span>
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
                        initialFocus
                        className="rounded-md border shadow-lg"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about the appointment"
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchDoctorId && watchDate && (
              <div className="pt-4">
                <AppointmentAnalytics
                  doctorId={watchDoctorId}
                  scheduledTime={watchDate}
                />
              </div>
            )}

            <Button 
              type="submit"
              className="w-full transition-all duration-200 hover:shadow-md"
            >
              {defaultValues ? 'Update Appointment' : 'Schedule Appointment'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}