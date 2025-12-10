export const API_URLS = {
  USGS_BASE: "https://waterservices.usgs.gov/nwis/iv/",
  OPEN_METEO_FLOOD: "https://flood-api.open-meteo.com/v1/flood",
  OPEN_METEO_WEATHER: "https://api.open-meteo.com/v1/forecast",
} as const;

export const USGS_PARAMS = {
  DISCHARGE: "00060",
  GAUGE_HEIGHT: "00065",
} as const;

// BLE configuration for ESP32 FloodWatch sensors
// These UUIDs should match the firmware configuration on ESP32 devices
export const BLE_CONFIG = {
  SERVICE_UUID: import.meta.env.VITE_BLE_SERVICE_UUID || "12345678-1234-5678-1234-56789abcdef0",
  CHARACTERISTICS: {
    WATER_LEVEL: import.meta.env.VITE_BLE_CHAR_WATER_LEVEL || "12345678-1234-5678-1234-56789abcdef1",
    RISE_RATE: import.meta.env.VITE_BLE_CHAR_RISE_RATE || "12345678-1234-5678-1234-56789abcdef2",
    BATTERY: import.meta.env.VITE_BLE_CHAR_BATTERY || "12345678-1234-5678-1234-56789abcdef3",
    STATUS: import.meta.env.VITE_BLE_CHAR_STATUS || "12345678-1234-5678-1234-56789abcdef4",
  },
  DEVICE_NAME_PREFIX: import.meta.env.VITE_BLE_DEVICE_PREFIX || "FloodWatch",
} as const;

export const CACHE_TIMES = {
  GAUGES_STALE: 15 * 60 * 1000,
  GAUGES_GC: 30 * 60 * 1000,
  FLOOD_FORECAST_STALE: 2 * 60 * 60 * 1000,
  FLOOD_FORECAST_GC: 6 * 60 * 60 * 1000,
} as const;

export const DEFAULT_MAP_CENTER = {
  lat: 39.8283,
  lng: -98.5795,
  zoom: 4,
} as const;
