export type RiskLevel = "safe" | "watch" | "warning" | "critical";

export type TrendDirection = "rising" | "stable" | "falling";

export type GaugeSource = "usgs" | "openmeteo" | "esp32";

export interface Gauge {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  source: GaugeSource;
  usgsCode?: string;
  state?: string;
  currentLevel?: number;
  currentDischarge?: number;
  riskLevel: RiskLevel;
  riskScore: number;
  trend: TrendDirection;
  lastUpdated: Date;
}

export interface GaugeReading {
  timestamp: Date;
  level: number;
  discharge?: number;
}

export interface WatchlistItem {
  gaugeId: string;
  addedAt: Date;
  alertsEnabled: boolean;
  thresholds: {
    watchLevel?: number;
    warningLevel?: number;
  };
}
