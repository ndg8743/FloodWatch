import { useSensorsStore } from "../stores/sensorsStore";
import { BLE_CONFIG } from "../utils/constants";
import type { ESP32Sensor, GaugeReading } from "../types";

class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristics: Map<string, BluetoothRemoteGATTCharacteristic> =
    new Map();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  async requestDevice(): Promise<BluetoothDevice> {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth not supported");
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: BLE_CONFIG.DEVICE_NAME_PREFIX }],
      optionalServices: [BLE_CONFIG.SERVICE_UUID],
    });

    return device;
  }

  async connect(device: BluetoothDevice): Promise<void> {
    const store = useSensorsStore.getState();
    this.device = device;

    device.addEventListener("gattserverdisconnected", () =>
      this.handleDisconnection()
    );

    store.setScanning(true);

    try {
      this.server = await device.gatt!.connect();

      const service = await this.server.getPrimaryService(
        BLE_CONFIG.SERVICE_UUID
      );

      const charUUIDs = Object.values(BLE_CONFIG.CHARACTERISTICS);
      for (const uuid of charUUIDs) {
        try {
          const char = await service.getCharacteristic(uuid);
          this.characteristics.set(uuid, char);
        } catch {
          console.warn(`Characteristic ${uuid} not found`);
        }
      }

      // Get user's current location for the sensor, fallback to null island
      const position = await this.getCurrentPosition();

      const sensor: ESP32Sensor = {
        id: device.id,
        deviceId: device.id,
        name: device.name || "ESP32 Sensor",
        latitude: position.latitude,
        longitude: position.longitude,
        source: "esp32",
        riskLevel: "safe",
        riskScore: 0,
        trend: "stable",
        lastUpdated: new Date(),
        batteryPercent: 100,
        riseRate: 0,
        connectionState: "connected",
      };

      store.addDevice(sensor);
      store.setScanning(false);
      this.reconnectAttempts = 0;

      await this.subscribeToNotifications();
    } catch (error) {
      store.setScanning(false);
      throw error;
    }
  }

  private async subscribeToNotifications(): Promise<void> {
    const store = useSensorsStore.getState();
    const levelChar = this.characteristics.get(
      BLE_CONFIG.CHARACTERISTICS.WATER_LEVEL
    );

    if (levelChar) {
      await levelChar.startNotifications();
      levelChar.addEventListener("characteristicvaluechanged", (event: Event) => {
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value && this.device) {
          this.handleReading(this.device.id, value);
        }
      });
    }

    const batteryChar = this.characteristics.get(
      BLE_CONFIG.CHARACTERISTICS.BATTERY
    );
    if (batteryChar) {
      await batteryChar.startNotifications();
      batteryChar.addEventListener("characteristicvaluechanged", (event: Event) => {
        const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value && this.device) {
          const battery = value.getUint8(0);
          const devices = store.connectedDevices;
          const device = devices.get(this.device.id);
          if (device) {
            store.addDevice({ ...device, batteryPercent: battery });
          }
        }
      });
    }
  }

  private handleReading(deviceId: string, data: DataView): void {
    const store = useSensorsStore.getState();

    const level = data.getFloat32(0, true);
    const riseRate = data.byteLength >= 8 ? data.getFloat32(4, true) : 0;

    const reading: GaugeReading = {
      timestamp: new Date(),
      level: level / 100,
    };

    store.updateReading(deviceId, reading);

    const device = store.connectedDevices.get(deviceId);
    if (device) {
      store.addDevice({
        ...device,
        currentLevel: level / 100,
        riseRate,
        lastUpdated: new Date(),
      });
    }
  }

  private handleDisconnection(): void {
    const store = useSensorsStore.getState();

    if (this.device) {
      store.setConnectionState(this.device.id, "disconnected");
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (!this.device) return;

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    const store = useSensorsStore.getState();
    store.setConnectionState(this.device.id, "connecting");

    this.reconnectTimeout = setTimeout(async () => {
      try {
        if (this.device?.gatt) {
          await this.connect(this.device);
        }
      } catch {
        this.handleDisconnection();
      }
    }, delay);
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    for (const char of this.characteristics.values()) {
      try {
        await char.stopNotifications();
      } catch {
        // Ignore
      }
    }

    this.characteristics.clear();

    if (this.device) {
      const store = useSensorsStore.getState();
      store.removeDevice(this.device.id);

      if (this.server?.connected) {
        this.device.gatt?.disconnect();
      }
    }

    this.device = null;
    this.server = null;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.server?.connected ?? false;
  }

  private getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: 0, longitude: 0 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve({ latitude: 0, longitude: 0 });
        },
        { timeout: 5000 }
      );
    });
  }
}

export const bluetoothManager = new BluetoothManager();
