/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLE_SERVICE_UUID?: string;
  readonly VITE_BLE_CHAR_WATER_LEVEL?: string;
  readonly VITE_BLE_CHAR_RISE_RATE?: string;
  readonly VITE_BLE_CHAR_BATTERY?: string;
  readonly VITE_BLE_CHAR_STATUS?: string;
  readonly VITE_BLE_DEVICE_PREFIX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
