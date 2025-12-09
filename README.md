# FloodWatch

A Progressive Web App (PWA) for real-time flood monitoring that combines official USGS gauge data with DIY ESP32 water level sensors via Bluetooth Low Energy (BLE).

## Features

- **Real-time USGS Data** - View water levels from thousands of official USGS gauges across the US
- **Custom ESP32 Sensors** - Connect your own BLE water level sensors for hyperlocal monitoring
- **Interactive Map** - Explore gauges on a Leaflet-powered map with risk indicators
- **Watchlist** - Save and track your favorite gauges with custom alerts
- **Risk Assessment** - Automatic flood risk calculation with color-coded levels
- **7-Day History** - View historical water level charts for any gauge
- **Dark Mode** - Full dark/light theme support
- **Offline Ready** - PWA with service worker caching

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser with Web Bluetooth support (Chrome on Android recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/ndg8743/FloodWatch.git
cd FloodWatch

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
FloodWatch/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Reusable UI primitives
│   │   ├── BottomNav.tsx
│   │   ├── SensorCard.tsx
│   │   ├── LiveChart.tsx
│   │   └── BluetoothConnect.tsx
│   ├── pages/           # Route pages
│   │   ├── HomePage.tsx
│   │   ├── MapPage.tsx
│   │   ├── SensorsPage.tsx
│   │   ├── DetailPage.tsx
│   │   ├── WatchlistPage.tsx
│   │   └── SettingsPage.tsx
│   ├── services/        # API & Bluetooth services
│   │   ├── usgsApi.ts
│   │   ├── openMeteoApi.ts
│   │   ├── riskCalculator.ts
│   │   └── bluetoothManager.ts
│   ├── stores/          # Zustand state stores
│   │   ├── watchlistStore.ts
│   │   ├── sensorsStore.ts
│   │   └── settingsStore.ts
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── utils/           # Helper functions
├── microcontroller/     # ESP32 firmware
│   ├── floodwatch_sensor/
│   │   └── floodwatch_sensor.ino
│   ├── SETUP.md
│   └── platformio.ini
└── public/
```

## ESP32 Sensor Setup

Build your own BLE water level sensor to complement official gauge data.

### Hardware Required

| Component | Description | ~Cost |
|-----------|-------------|-------|
| ESP32 DevKit V1 | Microcontroller with BLE | $8-15 |
| JSN-SR04T | Waterproof ultrasonic sensor | $8-12 |
| Jumper wires | For connections | $3-5 |

Optional for portable operation:
- 3.7V LiPo battery (18650 or pouch)
- TP4056 charging module
- Waterproof enclosure (IP65+)

### Wiring

```
ESP32              Ultrasonic Sensor
-----              -----------------
GPIO 5   ───────── TRIG
GPIO 18  ───────── ECHO
3.3V     ───────── VCC
GND      ───────── GND

Optional Battery Monitoring:
GPIO 34  ───────── Voltage divider (2x 10k resistors)
```

### Flashing the Firmware

#### Arduino IDE Method

1. Install [Arduino IDE](https://www.arduino.cc/en/software)

2. Add ESP32 board support:
   - Go to **File > Preferences**
   - Add to "Additional Board Manager URLs":
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
   - Go to **Tools > Board > Boards Manager**
   - Search "esp32" and install "ESP32 by Espressif Systems"

3. Select your board:
   - **Tools > Board > ESP32 Arduino > ESP32 Dev Module**
   - **Tools > Port > [Your COM port]**

4. Open and upload:
   - Open `microcontroller/floodwatch_sensor/floodwatch_sensor.ino`
   - Click Upload

#### PlatformIO Method

```bash
cd microcontroller
pio run -t upload
```

### Configuration

Edit the firmware to customize your sensor:

```cpp
// Device identification - change for multiple sensors
#define DEVICE_NAME "FloodWatch-001"

// Sensor mounting height above riverbed/ground (in cm)
#define SENSOR_HEIGHT_CM 200.0

// Alert thresholds (cm)
#define ALERT_LEVEL_WATCH 50.0
#define ALERT_LEVEL_WARNING 100.0
#define ALERT_LEVEL_CRITICAL 150.0
```

For custom BLE UUIDs (advanced), update both firmware and web app `.env`:

```env
# .env
VITE_BLE_SERVICE_UUID=your-custom-uuid
VITE_BLE_DEVICE_PREFIX=YourPrefix
```

### Connecting to the App

1. Power on your ESP32 sensor
2. Open FloodWatch in Chrome on Android
3. Go to **Sensors** tab
4. Tap **Connect** and select your device
5. View real-time data!

### Serial Monitor Debug

Connect via USB and open Serial Monitor (115200 baud) to see:

```
╔════════════════════════════════════════════╗
║         FloodWatch Water Sensor            ║
║  Version: 1.0.0                            ║
║  Device:  FloodWatch-001                   ║
╚════════════════════════════════════════════╝

┌──────────────────────────────────────────┐
│ Water Level: 45.3 cm  [NORMAL]
│ Rise Rate:   0.15 cm/hr
│ Min/Max:     42.1 / 48.7 cm
│ Battery:     87% (3.92V)
│ Status:      ok
│ BLE:         Connected (2 total)
│ Uptime:      1h 23m 45s
└──────────────────────────────────────────┘
```

## API Integrations

### USGS Water Services

Real-time water level and discharge data from ~10,000 stream gauges.

- Endpoint: `https://waterservices.usgs.gov/nwis/iv/`
- Parameters: Gauge height (00065), Discharge (00060)
- Auto-updates every 15 minutes

### Open-Meteo

Flood and precipitation forecasts.

- River discharge predictions
- Precipitation probability
- 7-day forecasts

## Environment Variables

Create a `.env` file for custom configuration:

```env
# BLE Configuration (optional - defaults provided)
VITE_BLE_SERVICE_UUID=12345678-1234-5678-1234-56789abcdef0
VITE_BLE_CHAR_WATER_LEVEL=12345678-1234-5678-1234-56789abcdef1
VITE_BLE_CHAR_RISE_RATE=12345678-1234-5678-1234-56789abcdef2
VITE_BLE_CHAR_BATTERY=12345678-1234-5678-1234-56789abcdef3
VITE_BLE_CHAR_STATUS=12345678-1234-5678-1234-56789abcdef4
VITE_BLE_DEVICE_PREFIX=FloodWatch
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State**: Zustand with persistence
- **Data Fetching**: TanStack Query
- **Maps**: Leaflet + React-Leaflet
- **Charts**: uPlot
- **Routing**: React Router v6
- **Firmware**: Arduino/ESP32

## Browser Support

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| PWA | Yes | Yes | Yes | Yes |
| Web Bluetooth | Yes | Yes | No | No |
| Geolocation | Yes | Yes | Yes | Yes |

**Note**: Web Bluetooth requires Chrome/Edge on Android or desktop. iOS does not support Web Bluetooth.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [USGS Water Services](https://waterservices.usgs.gov/) for real-time gauge data
- [Open-Meteo](https://open-meteo.com/) for flood forecasts
- [Leaflet](https://leafletjs.com/) for mapping
- [uPlot](https://github.com/leeoniya/uPlot) for fast charts
