import { clsx } from "clsx";
import type { RiskLevel } from "../../types";
import { riskColors, getRiskLabel } from "../../utils/riskColors";

interface BadgeProps {
  level: RiskLevel;
  size?: "sm" | "md";
}

export function Badge({ level, size = "md" }: BadgeProps) {
  const colors = riskColors[level];

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full",
        colors.bg,
        "text-white",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-sm"
      )}
    >
      {getRiskLabel(level)}
    </span>
  );
}
