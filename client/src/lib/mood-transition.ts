import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const moodTransitionClasses = {
  base: "transition-all duration-500 ease-in-out",
  background: "transition-colors duration-500 ease-in-out",
  transform: "transition-transform duration-500 ease-in-out",
  opacity: "transition-opacity duration-500 ease-in-out",
  scale: "transition-[transform,opacity] duration-500 ease-in-out",
};

export function getMoodGradient(color: string) {
  return `linear-gradient(to bottom right, ${color}10, ${color}25)`;
}

export function getMoodShadow(color: string) {
  return `0 4px 12px ${color}15`;
}
