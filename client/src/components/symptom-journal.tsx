import { useState } from "react";
import { useSymptomJournal } from "@/hooks/use-symptom-journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Props {
  patientId: number;
}

export function SymptomJournal({ patientId }: Props) {
  const { journals, addEntry, isLoading } = useSymptomJournal(patientId);
  const [open, setOpen] = useState(false);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [currentSymptom, setCurrentSymptom] = useState("");
  const [severity, setSeverity] = useState<number>(1);
  const [mood, setMood] = useState<string>("neutral");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addEntry({
      symptoms,
      severity,
      mood,
      notes,
    });
    setOpen(false);
    // Reset form
    setSymptoms([]);
    setCurrentSymptom("");
    setSeverity(1);
    setMood("neutral");
    setNotes("");
  };

  const addSymptom = () => {
    if (currentSymptom.trim()) {
      setSymptoms([...symptoms, currentSymptom.trim()]);
      setCurrentSymptom("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Symptom Journal</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Symptom Journal Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label>Symptoms</label>
                <div className="flex gap-2">
                  <Input
                    value={currentSymptom}
                    onChange={(e) => setCurrentSymptom(e.target.value)}
                    placeholder="Enter symptom"
                  />
                  <Button type="button" onClick={addSymptom}>
                    Add
                  </Button>
                </div>
                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {symptoms.map((symptom, index) => (
                      <span
                        key={index}
                        className="bg-secondary text-secondary-foreground px-2 py-1 rounded"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label>Severity (1-10)</label>
                <Select
                  value={severity.toString()}
                  onValueChange={(value) => setSeverity(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(10)].map((_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label>Mood</label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="sad">Sad</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="irritated">Irritated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label>Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes or context"
                />
              </div>

              <Button type="submit" className="w-full">
                Save Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {journals.map((journal) => (
          <Card key={journal.id} className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">
                  {new Date(journal.dateRecorded!).toLocaleDateString()}
                </h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <strong>Symptoms:</strong>{" "}
                    {journal.symptoms?.join(", ") || "None recorded"}
                  </p>
                  <p>
                    <strong>Severity:</strong> {journal.severity}/10
                  </p>
                  <p>
                    <strong>Mood:</strong>{" "}
                    <span className="capitalize">{journal.mood}</span>
                  </p>
                  {journal.notes && (
                    <p>
                      <strong>Notes:</strong> {journal.notes}
                    </p>
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