import { cn } from "@/lib/utils";

const TRACKS = {
  border: "bg-border [&::-webkit-progress-bar]:bg-border",
  muted: "bg-muted [&::-webkit-progress-bar]:bg-muted",
} as const;

/** Native <progress> styled as a thin rounded bar (semantic, and accessible by default). */
export function ProgressBar({ value, max = 100, min = 0, label, track = "border", className, valueClassName = "duration-500" }: Readonly<{ value: number; max?: number; min?: number; label: string; track?: keyof typeof TRACKS; className?: string; valueClassName?: string }>) {
  return (
    <progress
      value={value - min}
      max={max - min}
      aria-label={label}
      className={cn(
        "block h-1.5 w-full appearance-none overflow-hidden rounded-full",
        TRACKS[track],
        "[&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-primary",
        valueClassName,
        className,
      )}
    />
  );
}
