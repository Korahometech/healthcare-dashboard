import { useState } from "react";
import { useAppointments } from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { useDoctors } from "@/hooks/use-doctors";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentForm } from "@/components/appointment-form";
import { AppointmentList } from "@/components/appointments/appointment-list";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import type { InsertAppointment } from "@db/schema";

export default function Appointments() {
  const [open, setOpen] = useState(false);
  const { appointments, createAppointment, updateStatus } = useAppointments();
  const { patients } = usePatients();
  const { doctors } = useDoctors();
  const { toast } = useToast();

  const onSubmit = async (values: InsertAppointment) => {
    try {
      await createAppointment(values);
      setOpen(false);
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

  const handleStatusChange = async (id: number, status: 'confirmed' | 'cancelled') => {
    try {
      await updateStatus({ id, status });
      toast({
        title: "Success",
        description: `Appointment ${status} successfully`,
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
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage and schedule patient appointments
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              patients={patients}
              doctors={doctors}
              onSubmit={onSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-1">
          <AppointmentList
            appointments={appointments.map(apt => ({
              ...apt,
              date: new Date(apt.date),
            }))}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}