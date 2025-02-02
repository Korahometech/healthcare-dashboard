import { createContext, useContext, useEffect, useState } from "react";
import { format } from "date-fns";

type Mood = "calm" | "focused" | "energetic" | "serene" | "urgent";

interface MoodContextType {
  currentMood: Mood;
  setMood: (mood: Mood) => void;
  moodColors: {
    primary: string;
    background: string;
    text: string;
    accent: string;
  };
}

const getMoodColors = (mood: Mood) => {
  switch (mood) {
    case "calm":
      return {
        primary: "hsl(201, 94%, 86%)",
        background: "hsl(201, 94%, 96%)",
        text: "hsl(201, 94%, 20%)",
        accent: "hsl(201, 94%, 70%)",
      };
    case "focused":
      return {
        primary: "hsl(222, 83%, 41%)",
        background: "hsl(222, 83%, 98%)",
        text: "hsl(222, 83%, 16%)",
        accent: "hsl(222, 83%, 60%)",
      };
    case "energetic":
      return {
        primary: "hsl(350, 89%, 60%)",
        background: "hsl(350, 89%, 96%)",
        text: "hsl(350, 89%, 20%)",
        accent: "hsl(350, 89%, 80%)",
      };
    case "serene":
      return {
        primary: "hsl(150, 84%, 67%)",
        background: "hsl(150, 84%, 96%)",
        text: "hsl(150, 84%, 20%)",
        accent: "hsl(150, 84%, 80%)",
      };
    case "urgent":
      return {
        primary: "hsl(0, 84%, 60%)",
        background: "hsl(0, 84%, 96%)",
        text: "hsl(0, 84%, 20%)",
        accent: "hsl(0, 84%, 80%)",
      };
  }
};

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [currentMood, setMood] = useState<Mood>("focused");

  useEffect(() => {
    // Determine initial mood based on time of day
    const hour = parseInt(format(new Date(), "H"));
    if (hour >= 5 && hour < 9) {
      setMood("energetic"); // Morning energy
    } else if (hour >= 9 && hour < 17) {
      setMood("focused"); // Work hours
    } else if (hour >= 17 && hour < 20) {
      setMood("calm"); // Evening wind-down
    } else {
      setMood("serene"); // Night tranquility
    }
  }, []);

  const value = {
    currentMood,
    setMood,
    moodColors: getMoodColors(currentMood),
  };

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error("useMood must be used within a MoodProvider");
  }
  return context;
}
