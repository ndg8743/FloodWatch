import { clsx } from "clsx";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Gauge } from "../types";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { riskColors } from "../utils/riskColors";
import { formatLevel, formatRelativeTime } from "../utils/formatters";

interface SensorCardProps {
  gauge: Gauge;
  onClick?: () => void;
}

export function SensorCard({ gauge, onClick }: SensorCardProps) {
  const colors = riskColors[gauge.riskLevel];

  const TrendIcon =
    gauge.trend === "rising"
      ? TrendingUp
      : gauge.trend === "falling"
        ? TrendingDown
        : Minus;

  return (
    <Card
      onClick={onClick}
      className={clsx("border-l-4", colors.border)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {gauge.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {gauge.state || gauge.source.toUpperCase()}
          </p>
        </div>
        <Badge level={gauge.riskLevel} size="sm" />
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={clsx("text-2xl font-bold", colors.text)}>
              {formatLevel(gauge.currentLevel)}
            </span>
            <TrendIcon
              className={clsx(
                "w-5 h-5",
                gauge.trend === "rising" && "text-risk-critical",
                gauge.trend === "falling" && "text-risk-safe",
                gauge.trend === "stable" && "text-gray-400"
              )}
            />
          </div>
        </div>
        <span className="text-xs text-gray-400">
          {formatRelativeTime(gauge.lastUpdated)}
        </span>
      </div>
    </Card>
  );
}
