import { create } from "zustand";
import type { ESP32Sensor, GaugeReading, ConnectionState } from "../types";

interface SensorsState {
  bluetoothSupported: boolean;
  isScanning: boolean;
  connectedDevices: Map<string, ESP32Sensor>;
  readings: Map<string, GaugeReading[]>;

  setBluetoothSupported: (supported: boolean) => void;
  setScanning: (scanning: boolean) => void;
  addDevice: (sensor: ESP32Sensor) => void;
  updateReading: (deviceId: string, reading: GaugeReading) => void;
  removeDevice: (deviceId: string) => void;
  setConnectionState: (deviceId: string, state: ConnectionState) => void;
}

export const useSensorsStore = create<SensorsState>((set) => ({
  bluetoothSupported: "bluetooth" in navigator,
  isScanning: false,
  connectedDevices: new Map(),
  readings: new Map(),

  setBluetoothSupported: (supported) => set({ bluetoothSupported: supported }),

  setScanning: (scanning) => set({ isScanning: scanning }),

  addDevice: (sensor) =>
    set((state) => {
      const devices = new Map(state.connectedDevices);
      devices.set(sensor.deviceId, sensor);
      return { connectedDevices: devices };
    }),

  updateReading: (deviceId, reading) =>
    set((state) => {
      const readings = new Map(state.readings);
      const existing = readings.get(deviceId) || [];
      readings.set(deviceId, [...existing.slice(-100), reading]);
      return { readings };
    }),

  removeDevice: (deviceId) =>
    set((state) => {
      const devices = new Map(state.connectedDevices);
      devices.delete(deviceId);
      return { connectedDevices: devices };
    }),

  setConnectionState: (deviceId, connectionState) =>
    set((state) => {
      const devices = new Map(state.connectedDevices);
      const device = devices.get(deviceId);
      if (device) {
        devices.set(deviceId, { ...device, connectionState });
      }
      return { connectedDevices: devices };
    }),
}));
