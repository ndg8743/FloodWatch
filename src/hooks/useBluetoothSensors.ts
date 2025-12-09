import { useCallback } from "react";
import { useSensorsStore } from "../stores/sensorsStore";
import { bluetoothManager } from "../services/bluetoothManager";

export function useBluetoothSensors() {
  const {
    bluetoothSupported,
    isScanning,
    connectedDevices,
    readings,
  } = useSensorsStore();

  const startScan = useCallback(async () => {
    try {
      const device = await bluetoothManager.requestDevice();
      await bluetoothManager.connect(device);
    } catch (error) {
      if ((error as Error).name !== "NotFoundError") {
        console.error("Bluetooth error:", error);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    await bluetoothManager.disconnect();
  }, []);

  return {
    bluetoothSupported,
    isScanning,
    devices: Array.from(connectedDevices.values()),
    readings,
    startScan,
    disconnect,
    isConnected: bluetoothManager.isConnected(),
  };
}
