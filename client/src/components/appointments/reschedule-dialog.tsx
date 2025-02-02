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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Please select a new date and provide a reason for rescheduling.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label 
              id="new-date-label" 
              className="text-sm font-medium"
            >
              New Date
            </label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              disabled={(date) => date < new Date()}
              className="rounded-md border"
              aria-labelledby="new-date-label"
            />
          </div>
          <div className="space-y-2">
            <label 
              id="reschedule-reason-label" 
              className="text-sm font-medium"
            >
              Reason for Rescheduling
            </label>
            <Select 
              onValueChange={setReason} 
              value={reason}
              aria-labelledby="reschedule-reason-label"
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
            <Button 
              variant="outline" 
              onClick={onClose}
              type="button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!reason || isSubmitting}
              type="button"
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