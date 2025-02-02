import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const RESCHEDULE_REASONS = [
  { value: "schedule_conflict", label: "Schedule Conflict" },
  { value: "feeling_unwell", label: "Not Feeling Well" },
  { value: "transportation", label: "Transportation Issues" },
  { value: "emergency", label: "Emergency" },
  { value: "other", label: "Other" },
];

interface RescheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (date: Date, reason: string) => Promise<void>;
  currentDate: Date;
}

export function RescheduleDialog({
  isOpen,
  onClose,
  onReschedule,
  currentDate,
}: RescheduleDialogProps) {
  const [date, setDate] = useState<Date>(currentDate);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReschedule = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await onReschedule(date, reason);
      onClose();
    } catch (error) {
      console.error("Failed to reschedule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[425px]"
        aria-labelledby="reschedule-dialog-title"
        aria-describedby="reschedule-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="reschedule-dialog-title">Reschedule Appointment</DialogTitle>
          <DialogDescription id="reschedule-dialog-description">
            Please select a new date and provide a reason for rescheduling.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" id="calendar-label">
              New Date
            </label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
              aria-labelledby="calendar-label"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" id="reason-label">
              Reason for Rescheduling
            </label>
            <Select 
              onValueChange={setReason} 
              value={reason}
              aria-labelledby="reason-label"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {RESCHEDULE_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!reason || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                "Confirm Reschedule"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}