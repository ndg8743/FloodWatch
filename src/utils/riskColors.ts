import type { RiskLevel } from "../types";

export const riskColors: Record<
  RiskLevel,
  { bg: string; text: string; hex: string; border: string }
> = {
  safe: {
    bg: "bg-risk-safe",
    text: "text-risk-safe",
    hex: "#10b981",
    border: "border-risk-safe",
  },
  watch: {
    bg: "bg-risk-watch",
    text: "text-risk-watch",
    hex: "#f59e0b",
    border: "border-risk-watch",
  },
  warning: {
    bg: "bg-risk-warning",
    text: "text-risk-warning",
    hex: "#f97316",
    border: "border-risk-warning",
  },
  critical: {
    bg: "bg-risk-critical",
    text: "text-risk-critical",
    hex: "#ef4444",
    border: "border-risk-critical",
  },
};

export function getRiskLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    safe: "Normal",
    watch: "Watch",
    warning: "Warning",
    critical: "Critical",
  };
  return labels[level];
}
