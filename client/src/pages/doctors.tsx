import { useState } from "react";
import { useDoctors } from "@/hooks/use-doctors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import type { InsertDoctor } from "@db/schema";
import { insertDoctorSchema } from "@db/schema";

const specialties = [
  { id: 1, name: "Cardiology" },
  { id: 2, name: "Pediatrics" },
  { id: 3, name: "Orthopedics" },
  { id: 4, name: "Neurology" },
];

const availableDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

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
    },
  });

  const onSubmit = async (values: InsertDoctor) => {
    try {
      await createDoctor(values);
      setOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Doctor added successfully",
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
        <h1 className="text-3xl font-bold">Doctors</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Doctor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Doctor</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
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
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="MD, Cardiology" {...field} />
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
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
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
                      <Select
                        onValueChange={(value) =>
                          field.onChange([
                            ...(field.value || []),
                            value,
                          ])
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select days" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableDays.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value?.map((day) => (
                          <Button
                            key={day}
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              field.onChange(
                                field.value?.filter((d) => d !== day)
                              )
                            }
                          >
                            {day} ×
                          </Button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  Add Doctor
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
              <h3 className="font-semibold text-lg">{doctor.name}</h3>
              <p className="text-sm text-muted-foreground">
                Specialty: {specialties.find(s => s.id === doctor.specialtyId)?.name || 'Not specified'}
              </p>
              {doctor.qualification && (
                <p className="text-sm text-muted-foreground">
                  Qualification: {doctor.qualification}
                </p>
              )}
              {doctor.experience && (
                <p className="text-sm text-muted-foreground">
                  Experience: {doctor.experience} years
                </p>
              )}
              {doctor.availableDays && doctor.availableDays.length > 0 && (
                <div>
                  <p className="text-sm font-medium">Available Days:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {doctor.availableDays.map((day) => (
                      <span
                        key={day}
                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
