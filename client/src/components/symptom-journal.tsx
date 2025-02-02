import { useState } from "react";
import { useSymptomJournal } from "@/hooks/use-symptom-journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useMood } from "@/hooks/use-mood";
import { moodTransitionClasses } from "@/lib/mood-transition";
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
import { Plus, AlertTriangle, ThumbsUp, Frown, Smile } from "lucide-react";

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
  const { moodColors } = useMood();

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

  const getSeverityColor = (level: number) => {
    if (level >= 8) return "text-red-500";
    if (level >= 5) return "text-amber-500";
    return "text-green-500";
  };

  const getMoodIcon = (moodType: string) => {
    switch (moodType) {
      case "happy":
        return <Smile className="h-5 w-5 text-green-500" />;
      case "sad":
        return <Frown className="h-5 w-5 text-blue-500" />;
      case "anxious":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <ThumbsUp className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Symptom Journal</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className={moodTransitionClasses.base} style={{
              backgroundColor: moodColors.primary,
              color: moodColors.background,
            }}>
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
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={addSymptom}
                    variant="secondary"
                  >
                    Add
                  </Button>
                </div>
                {symptoms.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {symptoms.map((symptom, index) => (
                      <span
                        key={index}
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
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
                  <SelectTrigger className={getSeverityColor(severity)}>
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
                  className="h-24"
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
          <Card 
            key={journal.id} 
            className={`p-6 transform transition-all duration-300 hover:shadow-lg ${moodTransitionClasses.base}`}
            style={{
              borderColor: moodColors.primary + "40",
              background: `linear-gradient(135deg, ${moodColors.background}, ${moodColors.background})`
            }}
          >
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  {new Date(journal.dateRecorded!).toLocaleDateString()}
                  {getMoodIcon(journal.mood)}
                </h3>
                <div className="mt-2 space-y-2">
                  <p className="flex items-center gap-2">
                    <strong>Symptoms:</strong>
                    <div className="flex flex-wrap gap-1">
                      {journal.symptoms?.map((symptom, idx) => (
                        <span
                          key={idx}
                          className="bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-full text-sm"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </p>
                  <p>
                    <strong>Severity:</strong>{" "}
                    <span className={getSeverityColor(journal.severity)}>
                      {journal.severity}/10
                    </span>
                  </p>
                  <p>
                    <strong>Mood:</strong>{" "}
                    <span className="capitalize flex items-center gap-1">
                      {getMoodIcon(journal.mood)}
                      {journal.mood}
                    </span>
                  </p>
                  {journal.notes && (
                    <p className="text-muted-foreground">
                      <strong>Notes:</strong> {journal.notes}
                    </p>
                  )}
                </div>
              </div>

              {journal.analysis?.[0] && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">AI Analysis</h4>
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{journal.analysis[0].analysis}</p>
                    <div>
                      <strong>Sentiment:</strong>{" "}
                      <span className="capitalize">
                        {journal.analysis[0].sentiment}
                      </span>
                    </div>
                    {journal.analysis[0].suggestedActions && (
                      <div>
                        <strong>Suggested Actions:</strong>
                        <ul className="list-disc list-inside ml-4 text-muted-foreground">
                          {journal.analysis[0].suggestedActions.map(
                            (action, index) => (
                              <li key={index}>{action}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
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