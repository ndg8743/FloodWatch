import { Bluetooth, Loader2 } from "lucide-react";
import { useBluetoothSensors } from "../hooks/useBluetoothSensors";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { SensorCard } from "./SensorCard";

interface BluetoothConnectProps {
  onDeviceClick?: (deviceId: string) => void;
}

export function BluetoothConnect({ onDeviceClick }: BluetoothConnectProps) {
  const { bluetoothSupported, isScanning, devices, startScan, disconnect } =
    useBluetoothSensors();

  if (!bluetoothSupported) {
    return (
      <Card className="text-center py-6">
        <Bluetooth className="w-10 h-10 mx-auto text-gray-300 mb-2" />
        <p className="text-gray-500">Web Bluetooth not supported</p>
        <p className="text-sm text-gray-400 mt-1">
          Try using Chrome on Android
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bluetooth className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            ESP32 Sensors
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={startScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Scanning
            </>
          ) : (
            "Connect"
          )}
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card className="text-center py-8">
          <Bluetooth className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No sensors connected</p>
          <p className="text-sm text-gray-400 mt-1">
            Tap Connect to pair a FloodWatch sensor
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {devices.map((sensor) => (
            <div key={sensor.id} className="relative">
              <SensorCard
                gauge={sensor}
                onClick={() => onDeviceClick?.(sensor.id)}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  disconnect();
                }}
                className="absolute top-2 right-2 text-xs text-gray-400 hover:text-red-500"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
