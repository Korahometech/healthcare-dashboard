import { useState } from "react";
import { useDoctors } from "@/hooks/use-doctors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { InsertDoctor } from "@db/schema";
import { insertDoctorSchema } from "@db/schema";

const specialties = [
  { id: 1, name: "Cardiology" },
  { id: 2, name: "Pediatrics" },
  { id: 3, name: "Orthopedics" },
  { id: 4, name: "Neurology" },
  { id: 5, name: "Internal Medicine" },
  { id: 6, name: "Dermatology" },
  { id: 7, name: "Ophthalmology" },
  { id: 8, name: "General Surgery" },
];

const availableDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export default function Doctors() {
  const [open, setOpen] = useState(false);
  const { doctors, createDoctor } = useDoctors();
  const { toast } = useToast();

  const form = useForm<InsertDoctor>({
    resolver: zodResolver(insertDoctorSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      qualification: "",
      experience: 0,
      availableDays: [],
      startDate: null,
    },
  });

  const onSubmit = async (values: InsertDoctor) => {
    try {
      const formattedValues = {
        ...values,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
      };

      await createDoctor(formattedValues);
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Healthcare provider added successfully",
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
        <h1 className="text-3xl font-bold">Healthcare Providers</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Healthcare Provider</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>New Healthcare Provider</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="doctor@example.com"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+1234567890"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="specialtyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialty</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select specialty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {specialties.map((specialty) => (
                              <SelectItem
                                key={specialty.id}
                                value={specialty.id.toString()}
                              >
                                {specialty.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="MD, PhD"
                            value={field.value || ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            value={field.value || ""}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
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
                                format(new Date(field.value), "PPP")
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
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={field.onChange}
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
                  name="availableDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Days</FormLabel>
                      <div className="grid grid-cols-7 gap-2">
                        {availableDays.map((day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={field.value?.includes(day) ? "default" : "outline"}
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const currentValue = field.value || [];
                              field.onChange(
                                currentValue.includes(day)
                                  ? currentValue.filter((d) => d !== day)
                                  : [...currentValue, day]
                              );
                            }}
                          >
                            {day.slice(0, 3)}
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Add Healthcare Provider
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doctor) => (
          <Card key={doctor.id} className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{doctor.name}</h3>
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {specialties.find(s => s.id === doctor.specialtyId)?.name || 'General Practice'}
                </span>
              </div>
              {doctor.qualification && (
                <p className="text-sm text-muted-foreground">
                  Qualification: {doctor.qualification}
                </p>
              )}
              {doctor.experience !== null && doctor.experience > 0 && (
                <p className="text-sm text-muted-foreground">
                  Experience: {doctor.experience} years
                </p>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Available Days:</p>
                <div className="flex flex-wrap gap-1">
                  {doctor.availableDays?.map((day) => (
                    <span
                      key={day}
                      className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium">Contact Information:</p>
                <div className="grid grid-cols-1 gap-1 mt-1">
                  <p className="text-sm text-muted-foreground">{doctor.email}</p>
                  {doctor.phone && (
                    <p className="text-sm text-muted-foreground">{doctor.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}