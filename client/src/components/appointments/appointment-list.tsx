import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, User, Check, X, AlertCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/appointment-form";
import { useState } from "react";
import type { InsertAppointment } from "@db/schema";

interface Appointment {
  id: number;
  date: Date;
  status: 'scheduled' | 'confirmed' | 'cancelled';
  patient: {
    id: number;
    name: string;
  };
  doctor: {
    id: number;
    name: string;
  };
  notes?: string;
}

interface AppointmentListProps {
  appointments: Appointment[];
  onStatusChange?: (id: number, status: 'confirmed' | 'cancelled') => void;
  onEdit?: (id: number, data: InsertAppointment) => void;
  patients: Array<{ id: number; name: string }>;
  doctors: Array<{ id: number; name: string }>;
  className?: string;
}

export function AppointmentList({ 
  appointments, 
  onStatusChange, 
  onEdit,
  patients,
  doctors,
  className 
}: AppointmentListProps) {
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Check className="h-4 w-4" />;
      case 'cancelled':
        return <X className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {appointments.map((appointment) => (
        <Card 
          key={appointment.id}
          className="transform transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl font-semibold">
                  {format(new Date(appointment.date), "MMMM d, yyyy")}
                </CardTitle>
                <CardDescription>
                  {format(new Date(appointment.date), "h:mm a")}
                </CardDescription>
              </div>
              <Badge 
                variant="outline"
                className={cn(
                  "px-2 py-1 capitalize flex items-center gap-1",
                  getStatusColor(appointment.status)
                )}
              >
                {getStatusIcon(appointment.status)}
                {appointment.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">Patient:</span>
                  {appointment.patient.name}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">Doctor:</span>
                  {appointment.doctor.name}
                </div>
              </div>

              {appointment.notes && (
                <p className="text-sm text-muted-foreground">
                  {appointment.notes}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                {appointment.status === 'scheduled' && onStatusChange && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-green-500/20 text-green-500 hover:bg-green-500/10"
                      onClick={() => onStatusChange(appointment.id, 'confirmed')}
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10"
                      onClick={() => onStatusChange(appointment.id, 'cancelled')}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
                {onEdit && appointment.status !== 'cancelled' && (
                  <Dialog open={editingAppointment?.id === appointment.id} onOpenChange={(open) => {
                    if (!open) setEditingAppointment(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEditingAppointment(appointment)}
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Edit Appointment</DialogTitle>
                      </DialogHeader>
                      <AppointmentForm
                        patients={patients}
                        doctors={doctors}
                        onSubmit={(data) => {
                          onEdit(appointment.id, data);
                          setEditingAppointment(null);
                        }}
                        defaultValues={{
                          patientId: appointment.patient.id,
                          doctorId: appointment.doctor.id,
                          date: appointment.date,
                          notes: appointment.notes,
                        }}
                        title="Edit Appointment"
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}