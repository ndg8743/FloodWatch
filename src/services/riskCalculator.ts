import type { RiskLevel, GaugeReading, TrendDirection } from "../types";

interface RiskResult {
  level: RiskLevel;
  score: number;
}

const DEFAULT_THRESHOLDS = {
  actionStage: 2.0,
  floodStage: 3.0,
  majorFlood: 4.0,
};

export function calculateRiskLevel(
  currentLevel?: number,
  _currentDischarge?: number,
  thresholds = DEFAULT_THRESHOLDS
): RiskResult {
  if (currentLevel === undefined) {
    return { level: "safe", score: 0 };
  }

  if (currentLevel >= thresholds.majorFlood) {
    return { level: "critical", score: 100 };
  }

  if (currentLevel >= thresholds.floodStage) {
    const ratio =
      (currentLevel - thresholds.floodStage) /
      (thresholds.majorFlood - thresholds.floodStage);
    return { level: "warning", score: 50 + ratio * 25 };
  }

  if (currentLevel >= thresholds.actionStage) {
    const ratio =
      (currentLevel - thresholds.actionStage) /
      (thresholds.floodStage - thresholds.actionStage);
    return { level: "watch", score: 25 + ratio * 25 };
  }

  const ratio = currentLevel / thresholds.actionStage;
  return { level: "safe", score: ratio * 25 };
}

export function calculateTrend(readings: GaugeReading[]): TrendDirection {
  if (readings.length < 2) return "stable";

  const recent = readings.slice(-24);
  if (recent.length < 2) return "stable";

  const firstThird = recent.slice(0, Math.floor(recent.length / 3));
  const lastThird = recent.slice(-Math.floor(recent.length / 3));

  const avgFirst =
    firstThird.reduce((sum, r) => sum + r.level, 0) / firstThird.length;
  const avgLast =
    lastThird.reduce((sum, r) => sum + r.level, 0) / lastThird.length;

  const changePercent = ((avgLast - avgFirst) / avgFirst) * 100;

  if (changePercent > 5) return "rising";
  if (changePercent < -5) return "falling";
  return "stable";
}
