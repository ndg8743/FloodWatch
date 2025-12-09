import { clsx } from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      className={clsx(
        "animate-spin rounded-full border-2 border-gray-200 border-t-risk-safe",
        size === "sm" && "w-4 h-4",
        size === "md" && "w-8 h-8",
        size === "lg" && "w-12 h-12",
        className
      )}
    />
  );
}
