import type { Gauge } from "./gauge";

export type ConnectionState = "disconnected" | "connecting" | "connected";

export interface ESP32Sensor extends Gauge {
  source: "esp32";
  deviceId: string;
  batteryPercent: number;
  riseRate: number;
  connectionState: ConnectionState;
  rssi?: number;
}

export interface BluetoothReading {
  timestamp: Date;
  level: number;
  riseRate: number;
  battery: number;
}
